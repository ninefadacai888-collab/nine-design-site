"""Email notification service for order events.

Uses Gmail SMTP (smtp.gmail.com:587, STARTTLS) with an App Password.
All environment variables are optional except `GMAIL_SMTP_APP_PASSWORD`;
when missing, the notifier silently no-ops so order creation never fails
because of an email issue.

Environment variables:
    GMAIL_SMTP_APP_PASSWORD  (required) Gmail App Password (16 chars, no spaces).
    GMAIL_SMTP_USER          (optional) Sender Gmail address. Defaults to
                             `ninefadacai888@gmail.com`.
    GMAIL_ADMIN_EMAIL        (optional) Admin recipient. Defaults to
                             the sender address.
    GMAIL_SMTP_HOST          (optional) SMTP host, defaults to `smtp.gmail.com`.
    GMAIL_SMTP_PORT          (optional) SMTP port, defaults to 587.
"""

from __future__ import annotations

import asyncio
import logging
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from html import escape
from typing import Any, Dict, Iterable, List, Optional

logger = logging.getLogger(__name__)


DEFAULT_SENDER = "ninefadacai888@gmail.com"


def _get_smtp_credentials() -> Optional[Dict[str, Any]]:
    """Collect SMTP credentials from environment variables.

    Returns:
        Dict with keys: host, port, user, password, admin_email, sender_name.
        None if required password is not configured.
    """
    password = os.environ.get("GMAIL_SMTP_APP_PASSWORD")
    if not password:
        logger.warning(
            "GMAIL_SMTP_APP_PASSWORD is not set; email notifications disabled."
        )
        return None

    # Gmail app passwords are typically 16 chars; users often paste with spaces.
    password = password.replace(" ", "").strip()

    user = (os.environ.get("GMAIL_SMTP_USER") or DEFAULT_SENDER).strip()
    admin_email = (os.environ.get("GMAIL_ADMIN_EMAIL") or user).strip()
    host = os.environ.get("GMAIL_SMTP_HOST", "smtp.gmail.com").strip()
    try:
        port = int(os.environ.get("GMAIL_SMTP_PORT", "587"))
    except (TypeError, ValueError):
        port = 587

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "admin_email": admin_email,
        "sender_name": os.environ.get("GMAIL_SENDER_NAME", "SN Studio 訂單通知"),
    }


def _format_twd(amount: Any) -> str:
    """Format an integer/decimal as TWD currency string."""
    try:
        value = int(amount or 0)
    except (TypeError, ValueError):
        return f"NT$ {amount}"
    return f"NT$ {value:,}"


def _fmt_value(value: Any, fallback: str = "-") -> str:
    """Return trimmed string or fallback for None/empty."""
    if value is None:
        return fallback
    text = str(value).strip()
    return text if text else fallback


def _build_plain_body(
    order: Dict[str, Any], items: List[Dict[str, Any]]
) -> str:
    """Build plain text email body for email clients without HTML support."""
    lines: List[str] = []
    lines.append("🛎️ SN Studio 收到一筆新訂單")
    lines.append("")
    lines.append(f"訂單編號：#{_fmt_value(order.get('id'))}")
    lines.append(f"建立時間：{_fmt_value(order.get('created_at'))}")
    lines.append("")
    lines.append("── 客戶資訊 ──")
    lines.append(f"姓名：{_fmt_value(order.get('customer_name'))}")
    lines.append(f"電話：{_fmt_value(order.get('customer_phone'))}")
    lines.append(f"Email：{_fmt_value(order.get('customer_email'))}")
    # Shipping method labels (zh-TW)
    shipping_method = order.get("shipping_method") or ""
    shipping_region = order.get("shipping_region") or ""
    method_label_map = {
        "home_tw": "宅配到府 (台灣)",
        "home_overseas": f"宅配到府 ({'港澳' if shipping_region == 'hk_mo' else '海外'})",
        "cvs_711": "7-11 店到店取貨",
    }
    method_label = method_label_map.get(shipping_method, shipping_method or "-")
    lines.append(f"配送方式：{method_label}")
    if shipping_method == "cvs_711":
        lines.append(f"取貨門市：{_fmt_value(order.get('cvs_store_name'))} ({_fmt_value(order.get('cvs_store_id'))})")
        lines.append(f"門市地址：{_fmt_value(order.get('cvs_store_address'))}")
    else:
        lines.append(f"收件地址：{_fmt_value(order.get('shipping_address'))}")
    if order.get("note"):
        lines.append(f"備註：{_fmt_value(order.get('note'))}")
    lines.append("")
    lines.append("── 商品明細 ──")
    if not items:
        lines.append("(無商品明細)")
    else:
        for idx, item in enumerate(items, start=1):
            lines.append(
                f"{idx}. {_fmt_value(item.get('product_name'))} "
                f"x{_fmt_value(item.get('quantity'))} "
                f"@ {_format_twd(item.get('price'))} "
                f"= {_format_twd(int(item.get('price') or 0) * int(item.get('quantity') or 0))}"
            )
            if item.get("custom_content"):
                lines.append(f"   客製內容：{_fmt_value(item.get('custom_content'))}")
            if item.get("custom_image_key"):
                lines.append(f"   客製圖片：{_fmt_value(item.get('custom_image_key'))}")
    lines.append("")
    subtotal = order.get("subtotal_amount")
    shipping_fee = order.get("shipping_fee")
    if subtotal is not None:
        lines.append(f"商品小計：{_format_twd(subtotal)}")
    if shipping_fee is not None:
        lines.append(f"運費：{_format_twd(shipping_fee)}")
    lines.append(f"訂單總額：{_format_twd(order.get('total_amount'))}")
    lines.append(f"訂單狀態：{_fmt_value(order.get('status'))}")
    lines.append(f"付款狀態：{_fmt_value(order.get('payment_status'))}")
    lines.append("")
    lines.append("請登入後台管理系統確認並處理此訂單。")
    return "\n".join(lines)


def _build_html_body(
    order: Dict[str, Any], items: List[Dict[str, Any]]
) -> str:
    """Build rich HTML email body."""
    order_id = escape(str(order.get("id") or "-"))
    created_at = escape(str(order.get("created_at") or "-"))
    customer_name = escape(str(order.get("customer_name") or "-"))
    customer_phone = escape(str(order.get("customer_phone") or "-"))
    customer_email = escape(str(order.get("customer_email") or "-"))
    shipping_address = escape(str(order.get("shipping_address") or "-"))
    note_raw = order.get("note") or ""
    note_block = (
        f"<tr><td style='padding:6px 12px;color:#64748b;'>備註</td>"
        f"<td style='padding:6px 12px;white-space:pre-wrap;'>{escape(str(note_raw))}</td></tr>"
        if note_raw
        else ""
    )
    total_amount = escape(_format_twd(order.get("total_amount")))
    status = escape(str(order.get("status") or "pending"))
    payment_status = escape(str(order.get("payment_status") or "unpaid"))

    # Shipping details
    shipping_method = order.get("shipping_method") or ""
    shipping_region = order.get("shipping_region") or ""
    method_label_map = {
        "home_tw": "🏠 宅配到府 (台灣)",
        "home_overseas": f"✈️ 宅配到府 ({'港澳' if shipping_region == 'hk_mo' else '海外'})",
        "cvs_711": "🏪 7-11 店到店取貨",
    }
    method_label = escape(method_label_map.get(shipping_method, shipping_method or "-"))

    if shipping_method == "cvs_711":
        cvs_name = escape(str(order.get("cvs_store_name") or "-"))
        cvs_id = escape(str(order.get("cvs_store_id") or "-"))
        cvs_addr = escape(str(order.get("cvs_store_address") or "-"))
        shipping_detail_block = (
            f"<tr><td style='padding:8px 12px;color:#64748b;'>取貨門市</td>"
            f"<td style='padding:8px 12px;'>{cvs_name} <span style='color:#94a3b8;'>({cvs_id})</span></td></tr>"
            f"<tr style='background:#f8fafc;'><td style='padding:8px 12px;color:#64748b;'>門市地址</td>"
            f"<td style='padding:8px 12px;'>{cvs_addr}</td></tr>"
        )
    else:
        shipping_detail_block = (
            f"<tr><td style='padding:8px 12px;color:#64748b;'>收件地址</td>"
            f"<td style='padding:8px 12px;'>{shipping_address}</td></tr>"
        )

    subtotal_value = order.get("subtotal_amount")
    shipping_fee_value = order.get("shipping_fee")
    fee_breakdown = ""
    if subtotal_value is not None or shipping_fee_value is not None:
        subtotal_fmt = escape(_format_twd(subtotal_value)) if subtotal_value is not None else "-"
        fee_fmt = escape(_format_twd(shipping_fee_value)) if shipping_fee_value is not None else "-"
        fee_breakdown = (
            f"<div style='margin-bottom:8px;font-size:12px;color:#64748b;'>"
            f"商品小計：<span style='color:#0f172a;'>{subtotal_fmt}</span>"
            f"&nbsp;&nbsp;·&nbsp;&nbsp;運費：<span style='color:#0f172a;'>{fee_fmt}</span>"
            f"</div>"
        )

    item_rows: List[str] = []
    for idx, item in enumerate(items, start=1):
        qty = int(item.get("quantity") or 0)
        price = int(item.get("price") or 0)
        subtotal = qty * price
        custom_lines: List[str] = []
        if item.get("custom_content"):
            custom_lines.append(
                f"<div style='color:#475569;font-size:12px;margin-top:4px;'>"
                f"📝 客製內容：{escape(str(item['custom_content']))}</div>"
            )
        if item.get("custom_image_key"):
            custom_lines.append(
                f"<div style='color:#475569;font-size:12px;margin-top:2px;'>"
                f"🖼️ 客製圖片檔：<code>{escape(str(item['custom_image_key']))}</code></div>"
            )
        item_rows.append(
            f"<tr>"
            f"<td style='padding:10px;border-bottom:1px solid #e2e8f0;vertical-align:top;'>"
            f"<div style='font-weight:600;color:#0f172a;'>{idx}. {escape(str(item.get('product_name') or '-'))}</div>"
            f"{''.join(custom_lines)}"
            f"</td>"
            f"<td style='padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;color:#334155;'>{qty}</td>"
            f"<td style='padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#334155;'>{escape(_format_twd(price))}</td>"
            f"<td style='padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:#0f172a;'>{escape(_format_twd(subtotal))}</td>"
            f"</tr>"
        )

    if not item_rows:
        item_rows.append(
            "<tr><td colspan='4' style='padding:16px;text-align:center;color:#94a3b8;'>無商品明細</td></tr>"
        )

    html = f"""\
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans TC','PingFang TC','Microsoft JhengHei',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:#0f172a;color:#ffffff;padding:22px 28px;">
              <div style="font-size:12px;letter-spacing:2px;color:#94a3b8;">SN STUDIO · ADMIN NOTIFICATION</div>
              <div style="font-size:20px;font-weight:700;margin-top:4px;">🛎️ 收到一筆新訂單</div>
              <div style="margin-top:10px;font-size:13px;color:#cbd5e1;">
                訂單編號 <span style="color:#fbbf24;font-family:'SF Mono',monospace;">#{order_id}</span>
                &nbsp;·&nbsp; 建立時間 {created_at}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px;">
              <div style="font-size:14px;font-weight:600;color:#0f172a;margin-bottom:10px;">客戶資訊</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <tr style="background:#f8fafc;"><td style="padding:8px 12px;color:#64748b;width:80px;">姓名</td><td style="padding:8px 12px;">{customer_name}</td></tr>
                <tr><td style="padding:8px 12px;color:#64748b;">電話</td><td style="padding:8px 12px;">{customer_phone}</td></tr>
                <tr style="background:#f8fafc;"><td style="padding:8px 12px;color:#64748b;">Email</td><td style="padding:8px 12px;">{customer_email}</td></tr>
                <tr><td style="padding:8px 12px;color:#64748b;">配送方式</td><td style="padding:8px 12px;font-weight:600;">{method_label}</td></tr>
                {shipping_detail_block}
                {note_block}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 4px 28px;">
              <div style="font-size:14px;font-weight:600;color:#0f172a;margin-bottom:10px;">商品明細</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                <thead>
                  <tr style="background:#f8fafc;color:#475569;">
                    <th style="padding:10px;text-align:left;font-weight:600;">商品</th>
                    <th style="padding:10px;text-align:center;font-weight:600;width:60px;">數量</th>
                    <th style="padding:10px;text-align:right;font-weight:600;width:100px;">單價</th>
                    <th style="padding:10px;text-align:right;font-weight:600;width:110px;">小計</th>
                  </tr>
                </thead>
                <tbody>
                  {''.join(item_rows)}
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:14px 18px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;">
                    {fee_breakdown}
                    <div style="font-size:12px;color:#92400e;">訂單總額 (含運費)</div>
                    <div style="font-size:22px;font-weight:700;color:#78350f;margin-top:2px;">{total_amount}</div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:14px;font-size:12px;color:#64748b;">
                訂單狀態：<span style="color:#0f172a;font-weight:600;">{status}</span>
                &nbsp;&nbsp;·&nbsp;&nbsp;
                付款狀態：<span style="color:#0f172a;font-weight:600;">{payment_status}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:16px 28px;text-align:center;color:#94a3b8;font-size:11px;border-top:1px solid #e2e8f0;">
              此郵件由 SN Studio 系統自動寄送，請登入後台管理中心處理此訂單。
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    return html


def _send_email_sync(
    creds: Dict[str, Any],
    subject: str,
    text_body: str,
    html_body: str,
    recipients: Iterable[str],
) -> None:
    """Synchronous SMTP send. Run inside a thread via `asyncio.to_thread`."""
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = formataddr((creds["sender_name"], creds["user"]))
    message["To"] = ", ".join(recipients)

    message.attach(MIMEText(text_body, "plain", "utf-8"))
    message.attach(MIMEText(html_body, "html", "utf-8"))

    context = ssl.create_default_context()
    with smtplib.SMTP(creds["host"], creds["port"], timeout=15) as server:
        server.ehlo()
        server.starttls(context=context)
        server.ehlo()
        server.login(creds["user"], creds["password"])
        server.sendmail(creds["user"], list(recipients), message.as_string())


async def send_new_order_notification(
    order: Dict[str, Any], items: List[Dict[str, Any]]
) -> bool:
    """Send a new-order notification email to the configured admin address.

    Args:
        order: Dict-shaped order payload (id, customer_*, total_amount, etc.).
        items: List of order_items dicts (product_name, quantity, price, ...).

    Returns:
        True if the email was dispatched successfully, False otherwise.
        This function never raises — email failures must not break order flow.
    """
    creds = _get_smtp_credentials()
    if creds is None:
        return False

    subject = f"【SN Studio】新訂單通知 #{order.get('id')} - {_format_twd(order.get('total_amount'))}"
    text_body = _build_plain_body(order, items)
    html_body = _build_html_body(order, items)

    recipients = [creds["admin_email"]]

    try:
        await asyncio.to_thread(
            _send_email_sync,
            creds,
            subject,
            text_body,
            html_body,
            recipients,
        )
        logger.info(
            "Sent new-order notification email for order_id=%s to %s",
            order.get("id"),
            recipients,
        )
        return True
    except Exception as exc:
        logger.error(
            "Failed to send new-order notification for order_id=%s: %s",
            order.get("id"),
            exc,
            exc_info=True,
        )
        return False
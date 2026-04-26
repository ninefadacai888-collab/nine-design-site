import json
import logging
from datetime import datetime
from typing import Any, List, Optional


from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.orders import OrdersService
from services.order_items import Order_itemsService
from services.email_notifier import send_new_order_notification
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/orders", tags=["orders"])


# ---------- Pydantic Schemas ----------
class OrdersData(BaseModel):
    """Entity data schema (for create/update)"""
    customer_name: str
    customer_phone: str = None
    customer_email: str = None
    shipping_address: str = None
    note: str = None
    total_amount: int
    status: str = None
    payment_status: str = None
    shipping_method: Optional[str] = None
    shipping_region: Optional[str] = None
    shipping_fee: Optional[int] = 0
    subtotal_amount: Optional[int] = None
    cvs_store_id: Optional[str] = None
    cvs_store_name: Optional[str] = None
    cvs_store_address: Optional[str] = None
    payment_last5: Optional[str] = None


class OrdersUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    shipping_address: Optional[str] = None
    note: Optional[str] = None
    total_amount: Optional[int] = None
    status: Optional[str] = None
    payment_status: Optional[str] = None
    shipping_method: Optional[str] = None
    shipping_region: Optional[str] = None
    shipping_fee: Optional[int] = None
    subtotal_amount: Optional[int] = None
    cvs_store_id: Optional[str] = None
    cvs_store_name: Optional[str] = None
    cvs_store_address: Optional[str] = None
    payment_last5: Optional[str] = None


class OrdersResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    shipping_address: Optional[str] = None
    note: Optional[str] = None
    total_amount: int
    status: Optional[str] = None
    payment_status: Optional[str] = None
    shipping_method: Optional[str] = None
    shipping_region: Optional[str] = None
    shipping_fee: Optional[int] = None
    subtotal_amount: Optional[int] = None
    cvs_store_id: Optional[str] = None
    cvs_store_name: Optional[str] = None
    cvs_store_address: Optional[str] = None
    payment_last5: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrdersListResponse(BaseModel):
    """List response schema"""
    items: List[OrdersResponse]
    total: int
    skip: int
    limit: int


class OrdersBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[OrdersData]


class OrdersBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: OrdersUpdateData


class OrdersBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[OrdersBatchUpdateItem]


class OrdersBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=OrdersListResponse)
async def query_orderss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query orderss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying orderss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = OrdersService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} orderss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying orderss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=OrdersListResponse)
async def query_orderss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query orderss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying orderss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = OrdersService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} orderss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying orderss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=OrdersResponse)
async def get_orders(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single orders by ID (user can only see their own records)"""
    logger.debug(f"Fetching orders with id: {id}, fields={fields}")
    
    service = OrdersService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Orders with id {id} not found")
            raise HTTPException(status_code=404, detail="Orders not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching orders {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=OrdersResponse, status_code=201)
async def create_orders(
    data: OrdersData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new orders"""
    logger.debug(f"Creating new orders with data: {data}")
    
    service = OrdersService(db)
    try:
        result = await service.create(data.model_dump(), user_id=str(current_user.id))
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create orders")
        
        logger.info(f"Orders created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating orders: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating orders: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[OrdersResponse], status_code=201)
async def create_orderss_batch(
    request: OrdersBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple orderss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} orderss")
    
    service = OrdersService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} orderss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[OrdersResponse])
async def update_orderss_batch(
    request: OrdersBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple orderss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} orderss")
    
    service = OrdersService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} orderss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=OrdersResponse)
async def update_orders(
    id: int,
    data: OrdersUpdateData,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing orders (requires ownership)"""
    logger.debug(f"Updating orders {id} with data: {data}")

    service = OrdersService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Orders with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Orders not found")
        
        logger.info(f"Orders {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating orders {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating orders {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_orderss_batch(
    request: OrdersBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple orderss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} orderss")
    
    service = OrdersService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} orderss successfully")
        return {"message": f"Successfully deleted {deleted_count} orderss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_orders(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single orders by ID (requires ownership)"""
    logger.debug(f"Deleting orders with id: {id}")
    
    service = OrdersService(db)
    try:
        success = await service.delete(id, user_id=str(current_user.id))
        if not success:
            logger.warning(f"Orders with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Orders not found")
        
        logger.info(f"Orders {id} deleted successfully")
        return {"message": "Orders deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting orders {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# ---------- Extended Endpoints (admin details + email notification) ----------

class OrderItemBrief(BaseModel):
    """Minimal shape of an order_item returned inside order detail endpoints."""

    id: int
    order_id: int
    product_id: Optional[int] = None
    product_name: str
    quantity: int
    price: int
    custom_content: Optional[str] = None
    custom_image_key: Optional[str] = None

    class Config:
        from_attributes = True


class OrderDetailResponse(BaseModel):
    """Order with its related order_items; used by admin detail panel."""

    order: OrdersResponse
    items: List[OrderItemBrief]


class NotifyResponse(BaseModel):
    """Response from the order-notification endpoint."""

    order_id: int
    email_sent: bool


def _order_to_dict(order: Any) -> dict:
    """Serialize an Orders ORM instance to a plain dict for email rendering."""
    created_at = getattr(order, "created_at", None)
    return {
        "id": getattr(order, "id", None),
        "user_id": getattr(order, "user_id", None),
        "customer_name": getattr(order, "customer_name", None),
        "customer_phone": getattr(order, "customer_phone", None),
        "customer_email": getattr(order, "customer_email", None),
        "shipping_address": getattr(order, "shipping_address", None),
        "note": getattr(order, "note", None),
        "total_amount": getattr(order, "total_amount", None),
        "status": getattr(order, "status", None),
        "payment_status": getattr(order, "payment_status", None),
        "shipping_method": getattr(order, "shipping_method", None),
        "shipping_region": getattr(order, "shipping_region", None),
        "shipping_fee": getattr(order, "shipping_fee", None),
        "subtotal_amount": getattr(order, "subtotal_amount", None),
        "cvs_store_id": getattr(order, "cvs_store_id", None),
        "cvs_store_name": getattr(order, "cvs_store_name", None),
        "cvs_store_address": getattr(order, "cvs_store_address", None),
        "created_at": created_at.strftime("%Y-%m-%d %H:%M:%S")
        if created_at
        else None,
    }


def _item_to_dict(item: Any) -> dict:
    """Serialize an Order_items ORM instance to a plain dict."""
    return {
        "id": getattr(item, "id", None),
        "order_id": getattr(item, "order_id", None),
        "product_id": getattr(item, "product_id", None),
        "product_name": getattr(item, "product_name", None),
        "quantity": getattr(item, "quantity", None),
        "price": getattr(item, "price", None),
        "custom_content": getattr(item, "custom_content", None),
        "custom_image_key": getattr(item, "custom_image_key", None),
    }


@router.get("/{id}/detail", response_model=OrderDetailResponse)
async def get_order_detail(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch an order and its order_items.

    Admin users can access any order; regular users can only access orders they own.
    """
    is_admin = getattr(current_user, "role", None) == "admin"
    orders_service = OrdersService(db)
    items_service = Order_itemsService(db)

    try:
        order = await orders_service.get_by_id(
            id, user_id=None if is_admin else str(current_user.id)
        )
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        items = await items_service.list_by_field(
            field_name="order_id",
            field_value=id,
            skip=0,
            limit=500,
        )

        return {
            "order": order,
            "items": items,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching order detail {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{id}/notify", response_model=NotifyResponse)
async def notify_new_order(
    id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send the admin email notification for a newly-created order.

    This is intended to be called by the frontend checkout flow right after
    it has created both the order and all of its order_items, so the email
    can include the full shopping-cart breakdown.

    Both the order owner and an admin user may trigger this endpoint.
    """
    is_admin = getattr(current_user, "role", None) == "admin"
    orders_service = OrdersService(db)
    items_service = Order_itemsService(db)

    try:
        order = await orders_service.get_by_id(
            id, user_id=None if is_admin else str(current_user.id)
        )
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        items = await items_service.list_by_field(
            field_name="order_id",
            field_value=id,
            skip=0,
            limit=500,
        )

        email_sent = await send_new_order_notification(
            _order_to_dict(order),
            [_item_to_dict(item) for item in items],
        )
        return {"order_id": id, "email_sent": email_sent}
    except HTTPException:
        raise
    except Exception as e:
        # Email failures must never break the checkout flow; degrade gracefully.
        logger.error(
            f"Error sending order notification {id}: {str(e)}", exc_info=True
        )
        return {"order_id": id, "email_sent": False}
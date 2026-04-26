from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String, func


class Orders(Base):
    __tablename__ = "orders"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    shipping_address = Column(String, nullable=True)
    note = Column(String, nullable=True)
    total_amount = Column(Integer, nullable=False)
    status = Column(String, nullable=True)
    payment_status = Column(String, nullable=True)
    # Shipping fields
    shipping_method = Column(String, nullable=True)  # home_tw / home_overseas / cvs_711
    shipping_region = Column(String, nullable=True)  # taiwan / hk_mo / overseas (for home delivery)
    shipping_fee = Column(Integer, nullable=True, default=0)
    subtotal_amount = Column(Integer, nullable=True)  # product subtotal before shipping
    cvs_store_id = Column(String, nullable=True)  # 7-11 store id
    cvs_store_name = Column(String, nullable=True)  # 7-11 store name
    cvs_store_address = Column(String, nullable=True)  # 7-11 store address
    # Payment fields
    payment_last5 = Column(String, nullable=True)  # last 5 digits of payment account for reconciliation
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)
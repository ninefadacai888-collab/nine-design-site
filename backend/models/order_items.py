from core.database import Base
from sqlalchemy import Column, Integer, String


class Order_items(Base):
    __tablename__ = "order_items"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    order_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=True)
    product_name = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Integer, nullable=False)
    custom_content = Column(String, nullable=True)
    custom_image_key = Column(String, nullable=True)
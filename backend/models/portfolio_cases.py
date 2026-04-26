from core.database import Base
from sqlalchemy import Column, DateTime, Integer, String, func


class Portfolio_cases(Base):
    __tablename__ = "portfolio_cases"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=False)
    cover_image = Column(String, nullable=True)
    images = Column(String, nullable=True)
    client_name = Column(String, nullable=True)
    year = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=True)
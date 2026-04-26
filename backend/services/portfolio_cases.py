import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.portfolio_cases import Portfolio_cases

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Portfolio_casesService:
    """Service layer for Portfolio_cases operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any]) -> Optional[Portfolio_cases]:
        """Create a new portfolio_cases"""
        try:
            obj = Portfolio_cases(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created portfolio_cases with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating portfolio_cases: {str(e)}")
            raise

    async def get_by_id(self, obj_id: int) -> Optional[Portfolio_cases]:
        """Get portfolio_cases by ID"""
        try:
            query = select(Portfolio_cases).where(Portfolio_cases.id == obj_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching portfolio_cases {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of portfolio_casess"""
        try:
            query = select(Portfolio_cases)
            count_query = select(func.count(Portfolio_cases.id))
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Portfolio_cases, field):
                        query = query.where(getattr(Portfolio_cases, field) == value)
                        count_query = count_query.where(getattr(Portfolio_cases, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Portfolio_cases, field_name):
                        query = query.order_by(getattr(Portfolio_cases, field_name).desc())
                else:
                    if hasattr(Portfolio_cases, sort):
                        query = query.order_by(getattr(Portfolio_cases, sort))
            else:
                query = query.order_by(Portfolio_cases.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching portfolio_cases list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any]) -> Optional[Portfolio_cases]:
        """Update portfolio_cases"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Portfolio_cases {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key):
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated portfolio_cases {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating portfolio_cases {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int) -> bool:
        """Delete portfolio_cases"""
        try:
            obj = await self.get_by_id(obj_id)
            if not obj:
                logger.warning(f"Portfolio_cases {obj_id} not found for deletion")
                return False
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted portfolio_cases {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting portfolio_cases {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Portfolio_cases]:
        """Get portfolio_cases by any field"""
        try:
            if not hasattr(Portfolio_cases, field_name):
                raise ValueError(f"Field {field_name} does not exist on Portfolio_cases")
            result = await self.db.execute(
                select(Portfolio_cases).where(getattr(Portfolio_cases, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching portfolio_cases by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Portfolio_cases]:
        """Get list of portfolio_casess filtered by field"""
        try:
            if not hasattr(Portfolio_cases, field_name):
                raise ValueError(f"Field {field_name} does not exist on Portfolio_cases")
            result = await self.db.execute(
                select(Portfolio_cases)
                .where(getattr(Portfolio_cases, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Portfolio_cases.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching portfolio_casess by {field_name}: {str(e)}")
            raise
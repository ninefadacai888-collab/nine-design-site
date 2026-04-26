import json
import logging
from datetime import datetime
from typing import List, Optional


from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.portfolio_cases import Portfolio_casesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/portfolio_cases", tags=["portfolio_cases"])


# ---------- Pydantic Schemas ----------
class Portfolio_casesData(BaseModel):
    """Entity data schema (for create/update)"""
    title: str
    description: str = None
    category: str
    cover_image: str = None
    images: str = None
    client_name: str = None
    year: str = None


class Portfolio_casesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    cover_image: Optional[str] = None
    images: Optional[str] = None
    client_name: Optional[str] = None
    year: Optional[str] = None


class Portfolio_casesResponse(BaseModel):
    """Entity response schema"""
    id: int
    title: str
    description: Optional[str] = None
    category: str
    cover_image: Optional[str] = None
    images: Optional[str] = None
    client_name: Optional[str] = None
    year: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Portfolio_casesListResponse(BaseModel):
    """List response schema"""
    items: List[Portfolio_casesResponse]
    total: int
    skip: int
    limit: int


class Portfolio_casesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Portfolio_casesData]


class Portfolio_casesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Portfolio_casesUpdateData


class Portfolio_casesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Portfolio_casesBatchUpdateItem]


class Portfolio_casesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Portfolio_casesListResponse)
async def query_portfolio_casess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query portfolio_casess with filtering, sorting, and pagination"""
    logger.debug(f"Querying portfolio_casess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Portfolio_casesService(db)
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
        )
        logger.debug(f"Found {result['total']} portfolio_casess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying portfolio_casess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Portfolio_casesListResponse)
async def query_portfolio_casess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query portfolio_casess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying portfolio_casess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Portfolio_casesService(db)
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
        logger.debug(f"Found {result['total']} portfolio_casess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying portfolio_casess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Portfolio_casesResponse)
async def get_portfolio_cases(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single portfolio_cases by ID"""
    logger.debug(f"Fetching portfolio_cases with id: {id}, fields={fields}")
    
    service = Portfolio_casesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Portfolio_cases with id {id} not found")
            raise HTTPException(status_code=404, detail="Portfolio_cases not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching portfolio_cases {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Portfolio_casesResponse, status_code=201)
async def create_portfolio_cases(
    data: Portfolio_casesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new portfolio_cases"""
    logger.debug(f"Creating new portfolio_cases with data: {data}")
    
    service = Portfolio_casesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create portfolio_cases")
        
        logger.info(f"Portfolio_cases created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating portfolio_cases: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating portfolio_cases: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Portfolio_casesResponse], status_code=201)
async def create_portfolio_casess_batch(
    request: Portfolio_casesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple portfolio_casess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} portfolio_casess")
    
    service = Portfolio_casesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} portfolio_casess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Portfolio_casesResponse])
async def update_portfolio_casess_batch(
    request: Portfolio_casesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple portfolio_casess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} portfolio_casess")
    
    service = Portfolio_casesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} portfolio_casess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Portfolio_casesResponse)
async def update_portfolio_cases(
    id: int,
    data: Portfolio_casesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing portfolio_cases"""
    logger.debug(f"Updating portfolio_cases {id} with data: {data}")

    service = Portfolio_casesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Portfolio_cases with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Portfolio_cases not found")
        
        logger.info(f"Portfolio_cases {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating portfolio_cases {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating portfolio_cases {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_portfolio_casess_batch(
    request: Portfolio_casesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple portfolio_casess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} portfolio_casess")
    
    service = Portfolio_casesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} portfolio_casess successfully")
        return {"message": f"Successfully deleted {deleted_count} portfolio_casess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_portfolio_cases(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single portfolio_cases by ID"""
    logger.debug(f"Deleting portfolio_cases with id: {id}")
    
    service = Portfolio_casesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Portfolio_cases with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Portfolio_cases not found")
        
        logger.info(f"Portfolio_cases {id} deleted successfully")
        return {"message": "Portfolio_cases deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting portfolio_cases {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
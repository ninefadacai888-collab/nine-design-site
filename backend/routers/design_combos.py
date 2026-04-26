import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.design_combos import Design_combosService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/design_combos", tags=["design_combos"])


# ---------- Pydantic Schemas ----------
class Design_combosData(BaseModel):
    """Entity data schema (for create/update)"""
    name: str
    description: str = None
    items: str = None
    original_price: int = None
    sale_price: int
    image_url: str = None
    is_active: bool = None
    sort_order: int = None


class Design_combosUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    name: Optional[str] = None
    description: Optional[str] = None
    items: Optional[str] = None
    original_price: Optional[int] = None
    sale_price: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class Design_combosResponse(BaseModel):
    """Entity response schema"""
    id: int
    name: str
    description: Optional[str] = None
    items: Optional[str] = None
    original_price: Optional[int] = None
    sale_price: int
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Design_combosListResponse(BaseModel):
    """List response schema"""
    items: List[Design_combosResponse]
    total: int
    skip: int
    limit: int


class Design_combosBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Design_combosData]


class Design_combosBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Design_combosUpdateData


class Design_combosBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Design_combosBatchUpdateItem]


class Design_combosBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Design_combosListResponse)
async def query_design_comboss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query design_comboss with filtering, sorting, and pagination"""
    logger.debug(f"Querying design_comboss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Design_combosService(db)
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
        logger.debug(f"Found {result['total']} design_comboss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying design_comboss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Design_combosListResponse)
async def query_design_comboss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query design_comboss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying design_comboss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Design_combosService(db)
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
        logger.debug(f"Found {result['total']} design_comboss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying design_comboss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Design_combosResponse)
async def get_design_combos(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single design_combos by ID"""
    logger.debug(f"Fetching design_combos with id: {id}, fields={fields}")
    
    service = Design_combosService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Design_combos with id {id} not found")
            raise HTTPException(status_code=404, detail="Design_combos not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching design_combos {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Design_combosResponse, status_code=201)
async def create_design_combos(
    data: Design_combosData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new design_combos"""
    logger.debug(f"Creating new design_combos with data: {data}")
    
    service = Design_combosService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create design_combos")
        
        logger.info(f"Design_combos created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating design_combos: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating design_combos: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Design_combosResponse], status_code=201)
async def create_design_comboss_batch(
    request: Design_combosBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple design_comboss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} design_comboss")
    
    service = Design_combosService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} design_comboss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Design_combosResponse])
async def update_design_comboss_batch(
    request: Design_combosBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple design_comboss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} design_comboss")
    
    service = Design_combosService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} design_comboss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Design_combosResponse)
async def update_design_combos(
    id: int,
    data: Design_combosUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing design_combos"""
    logger.debug(f"Updating design_combos {id} with data: {data}")

    service = Design_combosService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Design_combos with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Design_combos not found")
        
        logger.info(f"Design_combos {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating design_combos {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating design_combos {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_design_comboss_batch(
    request: Design_combosBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple design_comboss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} design_comboss")
    
    service = Design_combosService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} design_comboss successfully")
        return {"message": f"Successfully deleted {deleted_count} design_comboss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_design_combos(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single design_combos by ID"""
    logger.debug(f"Deleting design_combos with id: {id}")
    
    service = Design_combosService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Design_combos with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Design_combos not found")
        
        logger.info(f"Design_combos {id} deleted successfully")
        return {"message": "Design_combos deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting design_combos {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.repositories import course_repository, week_repository
from app.schemas.course import CoursePublic, WeekSummary

router = APIRouter(prefix="/api/courses", tags=["courses"])


@router.get("", response_model=list[CoursePublic])
def list_courses(db: Session = Depends(get_db)):
    return course_repository.list_courses(db)


@router.get("/{course_id}/weeks", response_model=list[WeekSummary])
def list_weeks(course_id: int, db: Session = Depends(get_db)):
    if not course_repository.get_by_id(db, course_id):
        raise HTTPException(status_code=404, detail="Course not found")

    weeks = week_repository.list_weeks_with_counts(db, course_id)
    return [
        WeekSummary(
            id=week.id,
            week_number=week.week_number,
            title=week.title,
            question_count=count,
            difficulties=difficulties,
        )
        for week, count, difficulties in weeks
    ]

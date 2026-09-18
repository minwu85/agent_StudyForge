from pydantic import BaseModel, ConfigDict

from app.models.question import Difficulty


class CoursePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None


class WeekSummary(BaseModel):
    id: int
    week_number: int
    title: str
    question_count: int
    difficulties: list[Difficulty]

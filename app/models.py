from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    picture: Mapped[str | None] = mapped_column(Text, nullable=True)
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    state: Mapped["WinterArcState | None"] = relationship(back_populates="user", cascade="all, delete-orphan", single_parent=True)

class WinterArcState(Base):
    __tablename__ = "winterarc_states"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    data_json: Mapped[str] = mapped_column(Text, default="[]")  # full DATA array JSON
    checks_json: Mapped[str] = mapped_column(Text, default="{}") # checks map JSON
    stats_json: Mapped[str] = mapped_column(Text, default="{}") # 8 stats 1-10
    streak: Mapped[int] = mapped_column(Integer, default=0)
    last_100_date: Mapped[str | None] = mapped_column(String(20), nullable=True) # YYYY-MM-DD
    arc_start_date: Mapped[str | None] = mapped_column(String(20), nullable=True) # YYYY-MM-DD, arc start
    arc_days: Mapped[int] = mapped_column(Integer, default=90) # 90 standard or custom
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="state")

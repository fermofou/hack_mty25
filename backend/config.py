from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os, ssl

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("Missing DATABASE_URL in .env")

# asyncpg
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# WARNING: Disables SSL verification (for development only)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    # Connection pool tuning: reduce default pool size to avoid many idle connections
    # Default asyncpg pool often leaves ~5 idle connections. Adjust pool_size and
    # max_overflow to limit how many DB connections SQLAlchemy will keep open.
    # pool_pre_ping helps detect and recycle dead connections.
    connect_args={"ssl": ssl_context},
    pool_size=3,
    max_overflow=2,
    pool_timeout=30,
    pool_pre_ping=True,
)

AsyncSessionLocal = sessionmaker(
    bind=engine, expire_on_commit=False, class_=AsyncSession
)


async def get_session():
    async with AsyncSessionLocal() as session:
        yield session

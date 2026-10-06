"""
Test configuration.

Pre-existing module tests were written before authentication existed and call the
operational APIs directly. They now run with the authentication dependency overridden by a
synthetic administrator so they keep validating the (unchanged) AI / GIS / AIS logic.
Tests in test_auth_rbac.py opt OUT of this override and exercise the real auth stack.
"""
import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
from types import SimpleNamespace

import pytest

from app.core.auth import authenticate_user
from app.main import app


def _fake_admin():
    return SimpleNamespace(id="test-admin", name="Test Admin", email="admin@test.local",
                           role="admin", is_active=True)


@pytest.fixture(autouse=True)
def _default_admin_override(request):
    if request.node.get_closest_marker("real_auth"):
        app.dependency_overrides.pop(authenticate_user, None)
        yield
        app.dependency_overrides[authenticate_user] = _fake_admin
        return
    app.dependency_overrides[authenticate_user] = _fake_admin
    yield
    app.dependency_overrides.pop(authenticate_user, None)


def pytest_configure(config):
    config.addinivalue_line("markers", "real_auth: run with the real authentication stack")
    # Module-level TestClient(app) objects are created at import time (before fixtures run);
    # install the override immediately so those clients are authenticated as well.
    from app.main import app as main_app
    main_app.dependency_overrides[authenticate_user] = _fake_admin
    # Ensure all tables are created on the test SQLite database
    import app.models  # noqa: F401
    from app.database.session import Base, engine
    Base.metadata.create_all(bind=engine)

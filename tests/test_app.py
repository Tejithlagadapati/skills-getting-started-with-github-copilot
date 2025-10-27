from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Basic sanity checks
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    test_email = "pytest_student@example.com"

    # Ensure clean start
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # Signup should succeed
    r = client.post(f"/activities/{activity}/signup", params={"email": test_email})
    assert r.status_code == 200
    assert test_email in activities[activity]["participants"]

    # Duplicate signup should return 400
    r2 = client.post(f"/activities/{activity}/signup", params={"email": test_email})
    assert r2.status_code == 400

    # Unregister should succeed
    r3 = client.post(f"/activities/{activity}/unregister", params={"email": test_email})
    assert r3.status_code == 200
    assert test_email not in activities[activity]["participants"]


def test_signup_nonexistent_activity():
    r = client.post("/activities/Nonexistent%20Club/signup", params={"email": "a@b.com"})
    assert r.status_code == 404


def test_unregister_not_registered():
    activity = "Chess Club"
    email = "not_registered@example.com"

    # Ensure not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    r = client.post(f"/activities/{activity}/unregister", params={"email": email})
    assert r.status_code == 404

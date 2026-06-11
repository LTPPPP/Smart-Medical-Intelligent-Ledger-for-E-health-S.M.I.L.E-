from fastapi.testclient import TestClient

from src.main import app


def test_cccd_endpoint_returns_422_for_undecodable_image():
    client = TestClient(app, raise_server_exceptions=False)

    response = client.post(
        "/v1/ocr/cccd",
        files={
            "id_front": ("broken.jpg", b"not-an-image", "image/jpeg"),
            "id_back": ("broken-back.jpg", b"also-not-an-image", "image/jpeg"),
        },
    )

    assert response.status_code == 422
    assert response.json() == {
        "detail": "Uploaded identity document is not a decodable image.",
    }
    assert "/tmp/" not in response.text

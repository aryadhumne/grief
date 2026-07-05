import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import app
from database.db import db


def test_next_question_and_report_endpoints():
    app.config.update(TESTING=True)
    with app.app_context():
        db.drop_all()
        db.create_all()

    client = app.test_client()

    register_response = client.post('/register', json={
        'username': 'tester',
        'email': 'tester@example.com',
        'password': 'secret123'
    })
    assert register_response.status_code == 201

    login_response = client.post('/login', json={
        'email': 'tester@example.com',
        'password': 'secret123'
    })
    assert login_response.status_code == 200
    token = login_response.get_json()['token']

    headers = {'Authorization': f'Bearer {token}'}

    start_response = client.post('/start-interview', json={'role': 'software engineer'}, headers=headers)
    assert start_response.status_code == 200
    session_id = start_response.get_json()['session_id']

    next_response = client.post('/next-question', json={'session_id': session_id, 'role': 'software engineer'}, headers=headers)
    assert next_response.status_code == 200
    assert 'question' in next_response.get_json()

    upload_response = client.post('/upload-resume', json={'session_id': session_id, 'resume_text': 'React Flask Docker'}, headers=headers)
    assert upload_response.status_code == 200

    code_response = client.post('/coding-question', json={'role': 'software engineer', 'difficulty': 'hard'}, headers=headers)
    assert code_response.status_code == 200
    assert 'problem' in code_response.get_json()

    report_response = client.get(f'/final-report/{session_id}', headers=headers)
    assert report_response.status_code == 200

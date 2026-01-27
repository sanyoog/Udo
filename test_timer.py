#!/usr/bin/env python3
"""Test the timer API endpoints"""

import requests
import time
import json

BASE_URL = 'http://localhost:5000'

def test_get_active_timer():
    """Test GET /api/timer/active"""
    print("\n1. Testing GET /api/timer/active (should be empty initially)...")
    response = requests.get(f'{BASE_URL}/api/timer/active')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_start_timer():
    """Test POST /api/timer/active"""
    print("\n2. Testing POST /api/timer/active (start stopwatch)...")
    data = {
        'mode': 'stopwatch',
        'initialTime': 0,
        'pomodoroState': 'study',
        'sessionCount': 0
    }
    response = requests.post(f'{BASE_URL}/api/timer/active', json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_timer_running():
    """Test timer is counting"""
    print("\n3. Waiting 3 seconds and checking if timer is counting...")
    time.sleep(3)
    response = requests.get(f'{BASE_URL}/api/timer/active')
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Current time: {data.get('currentTime', 0)} seconds")
    print(f"Active: {data.get('active', False)}")
    return data

def test_pause_timer():
    """Test PUT /api/timer/active"""
    print("\n4. Testing PUT /api/timer/active (pause timer)...")
    response = requests.put(f'{BASE_URL}/api/timer/active')
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Paused at: {data.get('currentTime', 0)} seconds")
    print(f"Active: {data.get('active', False)}")
    return data

def test_delete_timer():
    """Test DELETE /api/timer/active"""
    print("\n5. Testing DELETE /api/timer/active (stop timer)...")
    response = requests.delete(f'{BASE_URL}/api/timer/active')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_pomodoro():
    """Test Pomodoro timer"""
    print("\n6. Testing Pomodoro timer (25 minutes = 1500 seconds)...")
    data = {
        'mode': 'pomodoro',
        'initialTime': 1500,
        'pomodoroState': 'study',
        'sessionCount': 0
    }
    response = requests.post(f'{BASE_URL}/api/timer/active', json=data)
    print(f"Status: {response.status_code}")
    print(f"Started Pomodoro: {response.json()}")
    
    time.sleep(2)
    response = requests.get(f'{BASE_URL}/api/timer/active')
    data = response.json()
    print(f"Time remaining: {data.get('currentTime', 0)} seconds")

if __name__ == '__main__':
    print("="*60)
    print("TIMER API ENDPOINT TESTS")
    print("="*60)
    
    try:
        test_get_active_timer()
        test_start_timer()
        test_timer_running()
        test_pause_timer()
        test_delete_timer()
        test_pomodoro()
        
        print("\n" + "="*60)
        print("ALL TESTS PASSED!")
        print("="*60)
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()

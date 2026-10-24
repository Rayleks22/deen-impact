#!/usr/bin/env python3
"""
PIN Hash Generator for DeenImpact Academy Results Portal
Generates salted SHA-256 PIN records for Cloudflare KV.

Usage:
  python hash-pin.py DIA/2026/001 542190
Output:
  KV Key:   student:DIA/2026/001
  KV Value: {"hash":"...","salt":"..."}
"""
import sys
import secrets
import hashlib
import json

def generate_pin_record(admission_number, pin):
    adm = admission_number.strip().upper()
    salt = secrets.token_hex(8)
    combined = (str(pin).strip() + ":" + salt).encode("utf-8")
    hash_hex = hashlib.sha256(combined).hexdigest()

    record = {
        "admissionNumber": adm,
        "salt": salt,
        "hash": hash_hex
    }
    
    print("\n=======================================================")
    print(f"DEENIMPACT ACADEMY - STUDENT PIN RECORD GENERATOR")
    print("=======================================================")
    print(f"Student Admission Number: {adm}")
    print(f"Plaintext PIN:           {pin}")
    print("-------------------------------------------------------")
    print(f"Cloudflare KV Key:       student:{adm}")
    print(f"Cloudflare KV Value:     {json.dumps({'salt': salt, 'hash': hash_hex})}")
    print("-------------------------------------------------------")
    print("File naming in R2 bucket (e.g. for Term 1, 2026-2027):")
    sanitized_adm = "".join([c if c.isalnum() else "_" for c in adm])
    print(f"  {sanitized_adm}_TERM1_2026-2027.pdf")
    print("=======================================================\n")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python hash-pin.py <ADMISSION_NUMBER> <PIN>")
        print("Example: python hash-pin.py DIA/2026/001 482910")
        sys.exit(1)
    generate_pin_record(sys.argv[1], sys.argv[2])

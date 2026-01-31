# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of CISO Dashboard seriously. If you have found a security vulnerability in the CISO Dashboard, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

### How to Report

Please send an email to the security team at [security@example.com](mailto:security@example.com).

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include

Please include as much information as possible to help us reproduce and fix the issue, including:

- Steps to reproduce the vulnerability
- Affected versions
- Any relevant configuration details
- Proof of Concept (PoC) code or screenshots

## Use of Cryptography

This project uses standard cryptographic libraries provided by the browser (Web Crypto API) and trusted third-party packages (e.g., `jose` for JWT handling if applicable). We do not implement custom cryptography.

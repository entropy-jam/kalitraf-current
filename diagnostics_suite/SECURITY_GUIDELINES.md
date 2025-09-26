# 🔒 Security Guidelines

## File Permission Standards

### Configuration Files (600)
- **Purpose**: Owner read/write only
- **Files**: `railway.toml`, `railway.json`, `config/*.json`, `requirements.txt`
- **Rationale**: Prevent accidental exposure of sensitive configuration

### Sensitive Directories (700)
- **Purpose**: Owner only access
- **Directories**: `config/`, `secrets/`
- **Rationale**: Protect configuration and secret storage

### Data Directories (755)
- **Purpose**: Owner full access, others read/execute
- **Directories**: `data/`, `logs/`
- **Rationale**: Allow web server to serve data files

### Code Files (644)
- **Purpose**: Owner read/write, others read
- **Files**: `*.py`, `*.js`, `*.html`, `*.css`
- **Rationale**: Standard for source code files

### Executable Scripts (755)
- **Purpose**: Owner full access, others read/execute
- **Files**: `bin/*.py`, `diagnostics_suite/*.py`
- **Rationale**: Allow execution while maintaining security

## Security Best Practices

### 1. Never Commit Sensitive Files
- Use `.gitignore` to exclude sensitive files
- Store secrets in environment variables
- Use Railway's secret management

### 2. Input Sanitization
- Always sanitize user input with `HTMLSanitizer`
- Use `HTMLSanitizer.setInnerHTML()` instead of `innerHTML`
- Validate all data before processing

### 3. Content Security Policy
- CSP headers are configured in `railway.toml`
- Prevents XSS attacks and data injection
- Restricts resource loading to trusted sources

### 4. Environment Variables
- Store all secrets in environment variables
- Use descriptive variable names
- Document required variables

### 5. Regular Security Audits
- Run `security-audit.py` regularly
- Review and fix security warnings
- Update dependencies regularly

## Running Security Checks

```bash
# Run full security audit
python3 diagnostics_suite/security-audit.py

# Fix file permissions
./diagnostics_suite/fix-permissions.sh

# Check for sensitive files
git status
git diff --cached
```

## Emergency Response

### If Sensitive Data is Committed
1. **Immediately** revoke exposed credentials
2. Remove sensitive data from git history
3. Force push to remove from remote
4. Generate new credentials
5. Update all references

### Security Incident Checklist
- [ ] Identify scope of exposure
- [ ] Revoke compromised credentials
- [ ] Update security measures
- [ ] Document incident
- [ ] Review and improve security

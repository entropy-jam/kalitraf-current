#!/usr/bin/env python3
"""
Security Audit Script for CHP Traffic Scraper
Comprehensive security analysis of the platform
"""

import os
import json
import re
import hashlib
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any
import logging

class SecurityAuditor:
    """Comprehensive security audit for the CHP Traffic Scraper platform"""
    
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.issues = []
        self.warnings = []
        self.recommendations = []
        
    def run_full_audit(self) -> Dict[str, Any]:
        """Run complete security audit"""
        print("🔒 Starting Security Audit...")
        
        # File system security
        self.audit_file_permissions()
        self.audit_sensitive_files()
        
        # Code security
        self.audit_hardcoded_secrets()
        self.audit_input_validation()
        self.audit_sql_injection_risks()
        self.audit_xss_risks()
        
        # Configuration security
        self.audit_configuration_files()
        self.audit_environment_variables()
        
        # Dependencies security
        self.audit_dependencies()
        
        # Network security
        self.audit_network_configuration()
        
        # Authentication & Authorization
        self.audit_authentication()
        
        # Data security
        self.audit_data_handling()
        
        return self.generate_report()
    
    def audit_file_permissions(self):
        """Check file permissions for security issues"""
        print("📁 Auditing file permissions...")
        
        sensitive_files = [
            "config/railway.json",
            "config/requirements.txt.python",
            "railway.toml",
            "railway.json"
        ]
        
        for file_path in sensitive_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                stat = full_path.stat()
                mode = oct(stat.st_mode)[-3:]
                
                if mode[2] != '0':  # World readable
                    self.warnings.append({
                        "type": "File Permissions",
                        "file": str(file_path),
                        "issue": f"File is world-readable (mode: {mode})",
                        "severity": "Medium"
                    })
    
    def audit_sensitive_files(self):
        """Check for sensitive files that shouldn't be in repo"""
        print("🔍 Scanning for sensitive files...")
        
        sensitive_patterns = [
            "*.key", "*.pem", "*.p12", "*.pfx",
            "*.env", ".env*", "*.secret", "*.password",
            "id_rsa", "id_dsa", "*.crt", "*.cert"
        ]
        
        for pattern in sensitive_patterns:
            for file_path in self.project_root.rglob(pattern):
                if file_path.is_file():
                    self.issues.append({
                        "type": "Sensitive File",
                        "file": str(file_path.relative_to(self.project_root)),
                        "issue": f"Sensitive file found: {pattern}",
                        "severity": "High"
                    })
    
    def audit_hardcoded_secrets(self):
        """Scan for hardcoded secrets in code"""
        print("🔐 Scanning for hardcoded secrets...")
        
        secret_patterns = [
            r'password\s*=\s*["\'][^"\']+["\']',
            r'api_key\s*=\s*["\'][^"\']+["\']',
            r'secret\s*=\s*["\'][^"\']+["\']',
            r'token\s*=\s*["\'][^"\']+["\']',
            r'key\s*=\s*["\'][A-Za-z0-9+/]{20,}["\']',  # Base64-like keys
            r'["\'][A-Za-z0-9+/]{40,}["\']',  # Long base64 strings
        ]
        
        code_files = list(self.project_root.rglob("*.py")) + list(self.project_root.rglob("*.js"))
        
        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for pattern in secret_patterns:
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        line_num = content[:match.start()].count('\n') + 1
                        self.issues.append({
                            "type": "Hardcoded Secret",
                            "file": str(file_path.relative_to(self.project_root)),
                            "line": line_num,
                            "issue": f"Potential hardcoded secret: {match.group()[:50]}...",
                            "severity": "High"
                        })
            except Exception as e:
                self.warnings.append({
                    "type": "File Access",
                    "file": str(file_path.relative_to(self.project_root)),
                    "issue": f"Could not read file: {e}",
                    "severity": "Low"
                })
    
    def audit_input_validation(self):
        """Check for input validation issues"""
        print("🛡️ Auditing input validation...")
        
        dangerous_functions = [
            'eval(', 'exec(', 'subprocess.run(', 'os.system(',
            'shell=True', 'input(', 'raw_input('
        ]
        
        python_files = list(self.project_root.rglob("*.py"))
        
        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for func in dangerous_functions:
                    if func in content:
                        line_num = content.find(func)
                        line_num = content[:line_num].count('\n') + 1
                        self.warnings.append({
                            "type": "Input Validation",
                            "file": str(file_path.relative_to(self.project_root)),
                            "line": line_num,
                            "issue": f"Potentially dangerous function: {func}",
                            "severity": "Medium"
                        })
            except Exception as e:
                continue
    
    def audit_sql_injection_risks(self):
        """Check for SQL injection risks"""
        print("💉 Checking for SQL injection risks...")
        
        # This project doesn't use SQL, but check for any database code
        sql_patterns = [
            r'SELECT.*FROM',
            r'INSERT.*INTO',
            r'UPDATE.*SET',
            r'DELETE.*FROM',
            r'DROP.*TABLE'
        ]
        
        code_files = list(self.project_root.rglob("*.py")) + list(self.project_root.rglob("*.js"))
        
        for file_path in code_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for pattern in sql_patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        self.warnings.append({
                            "type": "SQL Injection Risk",
                            "file": str(file_path.relative_to(self.project_root)),
                            "issue": f"SQL query found - ensure parameterized queries",
                            "severity": "Medium"
                        })
            except Exception as e:
                continue
    
    def audit_xss_risks(self):
        """Check for XSS risks in frontend code"""
        print("🌐 Checking for XSS risks...")
        
        js_files = list(self.project_root.rglob("*.js"))
        
        for file_path in js_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for innerHTML usage without sanitization
                if 'innerHTML' in content and 'sanitize' not in content:
                    self.warnings.append({
                        "type": "XSS Risk",
                        "file": str(file_path.relative_to(self.project_root)),
                        "issue": "innerHTML usage without sanitization",
                        "severity": "Medium"
                    })
                    
                # Check for eval usage
                if 'eval(' in content:
                    self.issues.append({
                        "type": "XSS Risk",
                        "file": str(file_path.relative_to(self.project_root)),
                        "issue": "eval() usage detected",
                        "severity": "High"
                    })
            except Exception as e:
                continue
    
    def audit_configuration_files(self):
        """Audit configuration files for security issues"""
        print("⚙️ Auditing configuration files...")
        
        config_files = [
            "railway.toml",
            "railway.json",
            "config/railway.json",
            "package.json"
        ]
        
        for config_file in config_files:
            config_path = self.project_root / config_file
            if config_path.exists():
                try:
                    with open(config_path, 'r') as f:
                        if config_file.endswith('.json'):
                            config = json.load(f)
                        else:
                            config = f.read()
                    
                    # Check for exposed secrets in config
                    if isinstance(config, dict):
                        for key, value in config.items():
                            if any(secret in key.lower() for secret in ['password', 'secret', 'key', 'token']):
                                if isinstance(value, str) and len(value) > 10:
                                    self.issues.append({
                                        "type": "Configuration Security",
                                        "file": config_file,
                                        "issue": f"Potential secret in config: {key}",
                                        "severity": "High"
                                    })
                except Exception as e:
                    self.warnings.append({
                        "type": "Configuration Access",
                        "file": config_file,
                        "issue": f"Could not read config: {e}",
                        "severity": "Low"
                    })
    
    def audit_environment_variables(self):
        """Check environment variable usage"""
        print("🌍 Auditing environment variables...")
        
        python_files = list(self.project_root.rglob("*.py"))
        
        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for os.environ usage
                if 'os.environ' in content:
                    # This is good - using environment variables
                    continue
                    
                # Check for hardcoded sensitive values
                if any(secret in content.lower() for secret in ['gmail_password', 'smtp_password', 'api_key']):
                    self.warnings.append({
                        "type": "Environment Variables",
                        "file": str(file_path.relative_to(self.project_root)),
                        "issue": "Consider using environment variables for sensitive data",
                        "severity": "Medium"
                    })
            except Exception as e:
                continue
    
    def audit_dependencies(self):
        """Audit dependencies for known vulnerabilities"""
        print("📦 Auditing dependencies...")
        
        # Check Python requirements
        req_file = self.project_root / "config/requirements.txt.python"
        if req_file.exists():
            try:
                with open(req_file, 'r') as f:
                    requirements = f.read()
                    
                # Check for pinned versions (good security practice)
                unpinned_deps = []
                for line in requirements.split('\n'):
                    line = line.strip()
                    if line and not line.startswith('#'):
                        if '==' not in line and '>=' not in line and '~=' not in line:
                            unpinned_deps.append(line)
                
                if unpinned_deps:
                    self.warnings.append({
                        "type": "Dependencies",
                        "file": "config/requirements.txt.python",
                        "issue": f"Unpinned dependencies: {', '.join(unpinned_deps)}",
                        "severity": "Medium"
                    })
            except Exception as e:
                self.warnings.append({
                    "type": "Dependencies",
                    "file": "config/requirements.txt.python",
                    "issue": f"Could not read requirements: {e}",
                    "severity": "Low"
                })
    
    def audit_network_configuration(self):
        """Audit network configuration"""
        print("🌐 Auditing network configuration...")
        
        # Check for HTTP usage (should be HTTPS in production)
        js_files = list(self.project_root.rglob("*.js"))
        
        for file_path in js_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                if 'http://' in content and 'localhost' not in content:
                    self.warnings.append({
                        "type": "Network Security",
                        "file": str(file_path.relative_to(self.project_root)),
                        "issue": "HTTP usage detected (consider HTTPS)",
                        "severity": "Medium"
                    })
            except Exception as e:
                continue
    
    def audit_authentication(self):
        """Audit authentication mechanisms"""
        print("🔑 Auditing authentication...")
        
        # Check for authentication implementation
        python_files = list(self.project_root.rglob("*.py"))
        
        auth_found = False
        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                if any(auth_term in content.lower() for auth_term in ['login', 'authenticate', 'session', 'jwt']):
                    auth_found = True
                    break
            except Exception as e:
                continue
        
        if not auth_found:
            self.recommendations.append({
                "type": "Authentication",
                "issue": "No authentication mechanism found - consider implementing for admin functions",
                "priority": "Medium"
            })
    
    def audit_data_handling(self):
        """Audit data handling practices"""
        print("📊 Auditing data handling...")
        
        # Check for data sanitization
        python_files = list(self.project_root.rglob("*.py"))
        
        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                # Check for JSON handling
                if 'json.load' in content or 'json.dump' in content:
                    if 'json.loads' in content and 'try' not in content:
                        self.warnings.append({
                            "type": "Data Handling",
                            "file": str(file_path.relative_to(self.project_root)),
                            "issue": "JSON parsing without error handling",
                            "severity": "Medium"
                        })
            except Exception as e:
                continue
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive security report"""
        total_issues = len(self.issues)
        total_warnings = len(self.warnings)
        total_recommendations = len(self.recommendations)
        
        # Calculate risk score
        risk_score = (total_issues * 3 + total_warnings * 2 + total_recommendations * 1) / 10
        risk_level = "Low" if risk_score < 3 else "Medium" if risk_score < 6 else "High"
        
        return {
            "summary": {
                "total_issues": total_issues,
                "total_warnings": total_warnings,
                "total_recommendations": total_recommendations,
                "risk_score": round(risk_score, 2),
                "risk_level": risk_level
            },
            "issues": self.issues,
            "warnings": self.warnings,
            "recommendations": self.recommendations
        }
    
    def print_report(self, report: Dict[str, Any]):
        """Print formatted security report"""
        print("\n" + "="*60)
        print("🔒 SECURITY AUDIT REPORT")
        print("="*60)
        
        summary = report["summary"]
        print(f"\n📊 SUMMARY:")
        print(f"   Risk Level: {summary['risk_level']} ({summary['risk_score']}/10)")
        print(f"   Issues: {summary['total_issues']}")
        print(f"   Warnings: {summary['total_warnings']}")
        print(f"   Recommendations: {summary['total_recommendations']}")
        
        if report["issues"]:
            print(f"\n🚨 HIGH PRIORITY ISSUES:")
            for issue in report["issues"]:
                print(f"   [{issue['severity']}] {issue['type']}")
                print(f"   File: {issue['file']}")
                if 'line' in issue:
                    print(f"   Line: {issue['line']}")
                print(f"   Issue: {issue['issue']}")
                print()
        
        if report["warnings"]:
            print(f"\n⚠️  WARNINGS:")
            for warning in report["warnings"]:
                print(f"   [{warning['severity']}] {warning['type']}")
                print(f"   File: {warning['file']}")
                if 'line' in warning:
                    print(f"   Line: {warning['line']}")
                print(f"   Issue: {warning['issue']}")
                print()
        
        if report["recommendations"]:
            print(f"\n💡 RECOMMENDATIONS:")
            for rec in report["recommendations"]:
                print(f"   [{rec['priority']}] {rec['type']}")
                print(f"   {rec['issue']}")
                print()

def main():
    """Main security audit function"""
    auditor = SecurityAuditor()
    report = auditor.run_full_audit()
    auditor.print_report(report)
    
    # Save report to file
    report_file = Path("diagnostics_suite/security-audit-report.json")
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Full report saved to: {report_file}")
    
    # Return exit code based on risk level
    if report["summary"]["risk_level"] == "High":
        sys.exit(1)
    elif report["summary"]["risk_level"] == "Medium":
        sys.exit(2)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()

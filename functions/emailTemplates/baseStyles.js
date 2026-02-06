// functions/emailTemplates/baseStyles.js

exports.styles = {
  body:
    "font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f0f4f8;color:#1a202c;margin:0;padding:20px",

  container:
    "max-width:650px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.1)",

  header:
    "background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;position:relative",

  headerTitle:
    "color:#ffffff;font-size:32px;margin:0;font-weight:700;letter-spacing:0.5px;text-shadow:0 2px 4px rgba(0,0,0,0.2)",

  headerSubtitle:
    "color:#f3f4f6;font-size:16px;margin-top:8px;font-weight:400;letter-spacing:0.3px",

  content:
    "padding:40px 35px;font-size:16px;line-height:1.8;color:#374151",

  greeting:
    "font-size:18px;margin-bottom:20px;color:#1f2937;font-weight:600",

  card:
    "background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);border:2px solid #e2e8f0;border-radius:12px;padding:25px;margin:25px 0;box-shadow:0 4px 6px rgba(0,0,0,0.05)",

  highlight:
    "color:#7c3aed;font-weight:700;background:linear-gradient(120deg,#7c3aed 0%,#a78bfa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text",

  infoBox:
    "background:linear-gradient(135deg,#dbeafe 0%,#bfdbfe 100%);border-left:5px solid #3b82f6;padding:20px;border-radius:10px;margin:25px 0;box-shadow:0 3px 10px rgba(59,130,246,0.15)",

  successBox:
    "background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);border-left:5px solid #10b981;padding:20px;border-radius:10px;margin:25px 0;box-shadow:0 3px 10px rgba(16,185,129,0.15)",

  warningBox:
    "background:linear-gradient(135deg,#fed7aa 0%,#fdba74 100%);border-left:5px solid #f59e0b;padding:20px;border-radius:10px;margin:25px 0;box-shadow:0 3px 10px rgba(245,158,11,0.15)",

  dangerBox:
    "background:linear-gradient(135deg,#fecaca 0%,#fca5a5 100%);border-left:5px solid #ef4444;padding:20px;border-radius:10px;margin:25px 0;box-shadow:0 3px 10px rgba(239,68,68,0.15)",

  footer:
    "background:linear-gradient(135deg,#f9fafb 0%,#f3f4f6 100%);padding:30px;text-align:center;font-size:13px;color:#6b7280;border-top:2px solid #e5e7eb",

  divider:
    "border:none;border-top:2px solid #e5e7eb;margin:30px 0",

  button:
    "display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px rgba(37,99,235,0.3);transition:all 0.3s ease",

  buttonSuccess:
    "display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px rgba(16,185,129,0.3)",

  iconBox:
    "width:60px;height:60px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(102,126,234,0.3)",

  badge:
    "display:inline-block;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);color:#78350f;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;margin:10px 0",

  listItem:
    "margin:12px 0;padding-left:25px;position:relative",

  listBullet:
    "content:'✓';position:absolute;left:0;color:#10b981;font-weight:bold;font-size:18px",

  tableCell:
    "padding:12px;border-bottom:1px solid #e5e7eb;text-align:left",

  tableCellBold:
    "padding:12px;border-bottom:1px solid #e5e7eb;text-align:left;font-weight:600;color:#1f2937",

  linkButton:
    "color:#3b82f6;text-decoration:none;font-weight:600;border-bottom:2px solid transparent;transition:border-color 0.3s",

  socialIcon:
    "display:inline-block;width:36px;height:36px;margin:0 8px;border-radius:50%;background:#667eea;color:#ffffff;text-align:center;line-height:36px",

  statusPending:
    "display:inline-block;background:#fef3c7;color:#92400e;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:600",

  statusApproved:
    "display:inline-block;background:#d1fae5;color:#065f46;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:600",

  statusRejected:
    "display:inline-block;background:#fee2e2;color:#991b1b;padding:6px 14px;border-radius:6px;font-size:13px;font-weight:600",
};
# Quick Start: Add Chatbot to Your Jekyll Site

## Option 1: Super Simple (5 minutes)

1. **Deploy your chatbot**: Get your Replit app URL (something like `https://your-app-name--username.replit.app`)

2. **Add floating widget**: Copy this code into your `_layouts/default.html` before `</body>`:

```html
<style>
#chat-btn{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:24px;color:white;box-shadow:0 4px 12px rgba(99,102,241,0.3);z-index:1000}
#chat-frame{position:fixed;bottom:90px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.15);background:white;display:none;z-index:999}
@media (max-width:768px){#chat-frame{width:calc(100vw - 40px);height:calc(100vh - 140px);left:20px}}
</style>
<button id="chat-btn">💬</button>
<iframe id="chat-frame" src="https://YOUR-REPLIT-URL/chat"></iframe>
<script>
document.getElementById('chat-btn').onclick=function(){
var f=document.getElementById('chat-frame'),open=f.style.display==='block';
f.style.display=open?'none':'block';this.textContent=open?'💬':'✕';
this.style.background=open?'linear-gradient(135deg,#6366f1,#8b5cf6)':'linear-gradient(135deg,#ef4444,#dc2626)'
}
</script>
```

3. **Replace URL**: Change `YOUR-REPLIT-URL` to your actual chatbot URL

Done! Your visitors now have a floating chat widget on every page.

## Option 2: Jekyll Include (10 minutes)

1. **Save the include file**: Copy `_includes/empathetic-chatbot.html` to your Jekyll site

2. **Use anywhere**: Add this to any page or post:
```liquid
{% include empathetic-chatbot.html replit_url="https://your-app.replit.app" %}
```

3. **Different styles**:
   - Floating widget: `{% include empathetic-chatbot.html %}`
   - Inline embed: `{% include empathetic-chatbot.html type="inline" %}`
   - Simple button: `{% include empathetic-chatbot.html type="button" %}`

## Option 3: Dedicated Page (15 minutes)

1. **Create page**: Save `dedicated-page.html` as a new page in your Jekyll site
2. **Update URL**: Replace the iframe src with your Replit URL
3. **Add to navigation**: Link to `/planning-assistant/` in your site menu

## Real Examples

### For a Writing Blog
```liquid
---
layout: post
title: "Overcoming Writer's Block"
---

Struggling to start that next chapter? Here's a technique that helps:

{% include empathetic-chatbot.html type="inline" title="Beat Writer's Block" description="Get personalized help breaking down your writing task" %}

The AI assistant uses CBT techniques to help examine those perfectionist fears...
```

### For a Productivity Site
```liquid
<!-- In _layouts/default.html -->
{% include empathetic-chatbot.html replit_url="https://my-planning-bot.replit.app" %}
```

### For a Coaching Website
```liquid
<!-- On your services page -->
{% include empathetic-chatbot.html type="button" text="Try Free Planning Session" %}
```

## Troubleshooting

**Widget not showing?** Check that:
- Your Replit app is deployed and accessible
- The URL is correct (test it in a new browser tab)
- No JavaScript errors in browser console

**Mobile issues?** The widget automatically adapts to mobile screens.

**Want to customize?** Edit the CSS in the include file to match your site's colors and fonts.

Your empathetic AI planning assistant is now ready to help your visitors overcome creative blocks and plan their days effectively!
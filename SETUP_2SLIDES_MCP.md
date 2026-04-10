# 2slides MCP Server Setup Guide

This guide provides step-by-step instructions for setting up and using the 2slides MCP server to create professional presentations, including for your cloud monitoring project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Step 1: Get Your API Key](#step-1-get-your-api-key)
- [Step 2: Install the 2slides MCP Server](#step-2-install-the-2slides-mcp-server)
- [Step 3: Configure in Claude Desktop](#step-3-configure-in-claude-desktop)
- [Step 4: Verify Installation](#step-4-verify-installation)
- [Usage Examples for Cloud Monitoring Presentation](#usage-examples-for-cloud-monitoring-presentation)
- [Available Tools Overview](#available-tools-overview)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

---

## Prerequisites

Before you begin, ensure you have:

1. **Node.js and npm** installed (version 14 or higher recommended)
   - Check with: `node --version` and `npm --version`
2. **Claude Desktop** installed on your machine
3. A **2slides.com account** (free or paid)

---

## Step 1: Get Your API Key

1. **Visit the 2slides API page:**
   - Navigate to [https://2slides.com/api](https://2slides.com/api)

2. **Sign up or log in:**
   - Create a new account or log in with your existing credentials

3. **Generate your API key:**
   - Follow the on-screen instructions to generate your API key
   - **Important:** Copy and save your API key securely - you'll need it for configuration

4. **Note your credit balance:**
   - Different operations consume different amounts of credits:
     - Fast PPT (theme-based): **1 credit per page**
     - Nano Banana (custom design): **100 credits per page** (1K/2K resolution) or **200 credits per page** (4K)
     - Narration generation: **210 credits per page** (10 for text + 200 for audio)

---

## Step 2: Install the 2slides MCP Server

The 2slides MCP server is distributed as an npm package and runs via `npx`, so no local installation is required. The package will be downloaded automatically when Claude Desktop starts.

**Package name:** `2slides-mcp`

---

## Step 3: Configure in Claude Desktop

### Configuration File Location

The configuration file location depends on your operating system:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### Configuration Steps

1. **Open the configuration file:**
   ```bash
   # macOS
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   
   # Linux
   nano ~/.config/Claude/claude_desktop_config.json
   ```

2. **Add the 2slides MCP server configuration:**

   If the file is empty or has only `{}`, replace it with:

   ```json
   {
     "mcpServers": {
       "2slides": {
         "command": "npx",
         "args": ["2slides-mcp"],
         "env": {
           "API_KEY": "YOUR_2SLIDES_API_KEY"
         }
       }
     }
   }
   ```

   If you already have other MCP servers configured, add the `"2slides"` entry to the existing `"mcpServers"` object:

   ```json
   {
     "mcpServers": {
       "existing-server": {
         "command": "...",
         "args": ["..."]
       },
       "2slides": {
         "command": "npx",
         "args": ["2slides-mcp"],
         "env": {
           "API_KEY": "YOUR_2SLIDES_API_KEY"
         }
       }
     }
   }
   ```

3. **Replace the API key:**
   - Replace `YOUR_2SLIDES_API_KEY` with your actual API key from Step 1

4. **Save the file**

---

## Step 4: Verify Installation

1. **Completely quit Claude Desktop:**
   - On macOS: Press `Cmd+Q` or right-click the dock icon and select "Quit"
   - On Windows/Linux: Exit the application completely (not just closing the window)

2. **Restart Claude Desktop**

3. **Check for 2slides tools:**
   - Start a new conversation in Claude
   - Open the tools panel (usually a wrench/tools icon)
   - You should see 6 tools from 2slides:
     - `slides_generate`
     - `themes_search`
     - `jobs_get`
     - `slides_create_like_this`
     - `slides_create_pdf_slides`
     - `slides_generate_narration`
     - `slides_download_pages_voices`

4. **Test with a simple request:**
   ```
   Search for business presentation themes on 2slides
   ```

---

## Usage Examples for Cloud Monitoring Presentation

### Example 1: Quick Presentation with Pre-built Theme (Fast PPT)

**Recommended for:** Quick presentations, standard layouts

```
Create a PowerPoint presentation about our cloud monitoring dashboard project.

First, search for a "technology" or "professional" theme, then generate a 
5-slide presentation covering:
1. Project Overview
2. Key Features (real-time monitoring, alerting)
3. Architecture (React frontend, Node.js backend, AWS deployment)
4. Benefits (cost savings, improved reliability)
5. Next Steps

Use English language and sync mode for immediate results.
```

**This workflow:**
1. Uses `themes_search` to find an appropriate theme
2. Uses `slides_generate` with sync mode to get the PowerPoint instantly
3. Costs: 5 credits (1 per slide)

---

### Example 2: Custom-Designed Presentation (Nano Banana)

**Recommended for:** Professional presentations with custom design

```
Create a custom-designed presentation about our cloud monitoring project with these specifications:

Content:
- Project Overview and Goals
- Dashboard Features and Screenshots
- Technical Architecture
- Performance Metrics
- Cost Analysis
- Future Roadmap

Design Style: "Modern tech presentation with dark blue and white colors, 
clean typography, professional charts and diagrams, tech-focused aesthetic"

Settings:
- Aspect Ratio: 16:9
- Resolution: 2K
- Pages: 6
- Content Detail: standard
- Language: English
- Mode: async

After generation completes, download the result.
```

**This workflow:**
1. Uses `slides_create_pdf_slides` to generate custom-designed slides
2. Returns a `jobId` for polling
3. Uses `jobs_get` to check status (poll every 20 seconds)
4. Downloads the final presentation when ready
5. Costs: 600 credits (100 per page × 6 pages)

---

### Example 3: Presentation with AI Narration

**Recommended for:** Video presentations, training materials

```
Create a narrated presentation about our cloud monitoring system:

Step 1: Generate the slides (6 pages, 16:9, 2K resolution)
Content covering the monitoring system features and benefits

Step 2: Add narration with two speakers:
- Speaker 1 (Alice): Technical narrator - use voice "Aoede"
- Speaker 2 (Bob): Business narrator - use voice "Puck"
- Content mode: standard

Step 3: Download the final package with slides and audio files
```

**This workflow:**
1. Uses `slides_create_pdf_slides` to create slides
2. Waits for completion using `jobs_get`
3. Uses `slides_generate_narration` with multi-speaker mode
4. Waits for narration completion
5. Uses `slides_download_pages_voices` to get ZIP with images and audio
6. Costs: 1,860 credits (100 per page × 6 for slides + 210 per page × 6 for narration)

---

### Example 4: Style-Matched Presentation

**Recommended for:** Matching existing brand/design guidelines

```
Create a presentation that matches our company's visual style.

Reference image: [URL to your company's presentation style or slide template]

Content: 8-page presentation about the cloud monitoring project covering
technical details, business benefits, and implementation timeline.

Settings:
- Aspect Ratio: 16:9
- Resolution: 2K
- Pages: 8
- Language: English
```

**This workflow:**
1. Uses `slides_create_like_this` with a reference image URL
2. Generates slides matching the visual style of the reference
3. Costs: 800 credits (100 per page × 8 pages)

---

## Available Tools Overview

### 1. `themes_search`
- **Purpose:** Find pre-built presentation themes
- **Credits:** Free
- **Use case:** Before using Fast PPT generation

### 2. `slides_generate` (Fast PPT)
- **Purpose:** Quick PowerPoint generation with themes
- **Credits:** 1 per page
- **Output:** .pptx file (editable PowerPoint)
- **Best for:** Standard presentations, quick turnaround

### 3. `slides_create_pdf_slides` (Nano Banana)
- **Purpose:** Custom-designed slides from scratch
- **Credits:** 100 per page (2K) or 200 per page (4K)
- **Output:** PDF slides with custom design
- **Best for:** High-quality, professionally designed presentations

### 4. `slides_create_like_this` (Nano Banana)
- **Purpose:** Generate slides matching a reference style
- **Credits:** 100 per page (2K) or 200 per page (4K)
- **Requires:** Reference image URL
- **Best for:** Brand-consistent presentations

### 5. `slides_generate_narration`
- **Purpose:** Add AI voice narration to Nano Banana slides
- **Credits:** 210 per page
- **Modes:** Single speaker or multi-speaker dialogue
- **Voices:** 30 different AI voices available

### 6. `jobs_get`
- **Purpose:** Check async job status
- **Credits:** Free
- **Use:** Poll every 20 seconds until completion

### 7. `slides_download_pages_voices`
- **Purpose:** Download slides + audio as ZIP
- **Credits:** Free
- **Contains:** PNG images, WAV audio files, transcript

---

## Troubleshooting

### Tools Don't Appear in Claude

**Solution:**
1. Verify the config file path is correct for your OS
2. Check that the JSON syntax is valid (no trailing commas, proper quotes)
3. Ensure you completely quit and restarted Claude Desktop
4. Check the API key is correct (no extra spaces)

### Check MCP Logs

View detailed logs to diagnose issues:

```bash
# macOS
tail -n 50 -f ~/Library/Logs/Claude/mcp*.log

# Linux
tail -n 50 -f ~/.config/Claude/logs/mcp*.log

# Windows (PowerShell)
Get-Content "$env:APPDATA\Claude\logs\mcp*.log" -Wait -Tail 50
```

### "API Key Invalid" or Authentication Errors

**Solution:**
1. Verify your API key at [https://2slides.com/api](https://2slides.com/api)
2. Regenerate a new API key if needed
3. Update the config file with the new key
4. Restart Claude Desktop

### Job Status Stuck at "Pending" or "Processing"

**Solution:**
1. Wait at least 20-30 seconds between polls
2. For complex presentations (8+ slides, 4K), generation may take 2-5 minutes
3. Check your credit balance - insufficient credits will cause failures
4. If stuck for >10 minutes, the job may have failed - check the job status message

### "Insufficient Credits" Error

**Solution:**
1. Check your credit balance at [https://2slides.com/api](https://2slides.com/api)
2. Purchase additional credits if needed
3. Use Fast PPT (1 credit/page) instead of Nano Banana for simpler presentations

### Download URL Expired

**Solution:**
- Download URLs expire after 1 hour
- If expired, you may need to regenerate the presentation
- For narration downloads, the ZIP link expires in 1 hour from generation

---

## Additional Resources

### Official Documentation
- **2slides API Docs:** [https://2slides.com/api](https://2slides.com/api)
- **2slides Templates:** [https://2slides.com/templates](https://2slides.com/templates)
- **MCP Documentation:** [https://modelcontextprotocol.io/docs/develop/build-server](https://modelcontextprotocol.io/docs/develop/build-server)

### GitHub Repository
- **2slides MCP Server:** [https://github.com/2slides/mcp-2slides](https://github.com/2slides/mcp-2slides)

### Voice Options (for Narration)

30 available AI voices:
- `Puck`, `Aoede`, `Charon`, `Kore`, `Fenrir`, `Zephyr`, `Leda`, `Orus`
- `Callirrhoe`, `Autonoe`, `Enceladus`, `Iapetus`, `Umbriel`, `Algieba`
- `Despina`, `Erinome`, `Algenib`, `Rasalgethi`, `Laomedeia`, `Achernar`
- `Alnilam`, `Schedar`, `Gacrux`, `Pulcherrima`, `Achird`, `Zubenelgenubi`
- `Vindemiatrix`, `Sadachbia`, `Sadaltager`, `Sulafat`

### Supported Languages

Response language options: `Auto`, `English`, `Spanish`, `Arabic`, `Portuguese`, `Indonesian`, `Japanese`, `Russian`, `Hindi`, `French`, `German`, `Greek`, `Vietnamese`, `Turkish`, `Thai`, `Polish`, `Italian`, `Korean`, `Simplified Chinese`, `Traditional Chinese`

### Aspect Ratios

- `1:1` - Square
- `2:3`, `3:2` - Photo formats
- `3:4`, `4:3` - Classic presentations
- `4:5`, `5:4` - Social media
- `9:16`, `16:9` - Widescreen (recommended for presentations)
- `21:9` - Ultra-wide

---

## Quick Reference Commands

### Test the Setup
```
Search for "minimal" themes on 2slides and show me the top 3 results
```

### Generate Quick PowerPoint
```
Use theme ID "st-xxxxx" to create a 3-slide presentation about [topic]
```

### Create Custom Presentation
```
Create a custom-designed 5-slide presentation about [topic] 
with modern professional design, 16:9 ratio, 2K resolution
```

### Check Job Status
```
Check the status of job "xxxxx-xxxxx-xxxxx"
```

### Add Narration
```
Add narration to job "xxxxx" with speaker "Alice" using voice "Aoede"
```

---

## Best Practices

1. **Start with Fast PPT** for prototyping - it's cheaper (1 credit/page)
2. **Use Nano Banana** for final presentations when quality matters
3. **Always search themes first** before Fast PPT generation
4. **Use async mode** for presentations with 5+ slides
5. **Poll jobs every 20 seconds** - not more frequently
6. **Save download URLs immediately** - they expire in 1 hour
7. **Test narration voices** with a small presentation first
8. **Monitor your credit usage** for large projects

---

**Last Updated:** April 2026

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Backend running!', timestamp: new Date().toISOString() });
});

// Network analysis endpoint
app.post('/api/analyze-network', async (req, res) => {
  try {
    const { networkData, focus, topic } = req.body;

    // Validate input
    if (!networkData || !focus || !topic) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`Analyzing network for topic: ${topic}, focus: ${focus}`);

    // Call Claude API
    const insights = await generateClaudeInsights(networkData, focus, topic);
    
    res.json({ insights });

  } catch (error) {
    console.error('Network analysis error:', error);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

async function generateClaudeInsights(networkData, focus, topic) {
  const prompt = `As an AI safety research strategy expert, analyze this collaboration network data:

TOPIC: ${topic}
ANALYSIS FOCUS: ${focus}
NETWORK DATA:
- ${networkData.institutions.length} institutions
- ${networkData.collaborations.length} collaborations  
- ${networkData.totalPapers} total papers

TOP INSTITUTIONS:
${networkData.institutions.slice(0, 5).map(inst => 
  `• ${inst.name}: ${inst.papers} papers, ${inst.citations} citations, ${inst.authors} researchers`
).join('\n')}

TOP COLLABORATIONS:
${networkData.collaborations.slice(0, 3).map(collab => 
  `• ${collab.pair}: ${collab.count} joint papers`
).join('\n')}

Provide 3-4 strategic insights for program managers:
1. **Partnership Opportunities**
2. **Talent Concentration Analysis**
3. **Research Gaps/Bottlenecks**
4. **Strategic Recommendations**

Keep insights concise, actionable, and executive-focused.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    return message.content[0].text;

  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Claude API failed: ${error.message}`);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Network Analysis Backend running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  
  // Test Claude API key on startup
  if (!process.env.CLAUDE_API_KEY) {
    console.warn('⚠️  Warning: CLAUDE_API_KEY not found in .env file');
  } else {
    console.log('✅ Claude API key loaded');
  }
});
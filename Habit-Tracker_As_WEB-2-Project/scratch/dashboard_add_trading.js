const fs = require('fs');
const path = 'c:/Users/moiah/Desktop/New folder/Habit-Tracker_As_WEB-2-Project/frontend/src/pages/Dashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add TrendingUp icon import
content = content.replace(
  "import { Clock, ArrowRight, CheckSquare, Play, Shield } from 'lucide-react';",
  "import { Clock, ArrowRight, CheckSquare, Play, Shield, TrendingUp } from 'lucide-react';"
);

// 2. Add propAccount state
content = content.replace(
  "  const [summary, setSummary] = useState({",
  "  const [propAccount, setPropAccount] = useState(null);\n  const [summary, setSummary] = useState({"
);

// 3. Update Promise.all to fetch prop-account
content = content.replace(
  "api.get('/streak/status'),",
  "api.get('/streak/status'),\n          api.get('/prop-account')"
);

content = content.replace(
  "const [workRes, tasksRes, streakRes] = await Promise.all",
  "const [workRes, tasksRes, streakRes, propRes] = await Promise.all"
);

content = content.replace(
  "        if (streakRes.data.success && streakRes.data.data) {",
  "        if (propRes && propRes.data.success && propRes.data.data) {\n           setPropAccount(propRes.data.data);\n        }\n\n        if (streakRes.data.success && streakRes.data.data) {"
);

// 4. Update grid
content = content.replace(
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-6">',
  '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">'
);

// 5. Add trading card
const todoCardEnd = content.indexOf('</Link>', content.indexOf('{/* Todo Card */}')) + 7;
if (todoCardEnd !== 6) {
  const tradingCard = `

        {/* Trading Card */}
        <Link to="/trading" className="google-card overflow-hidden group border border-[#dadce0] hover:border-[#10b981]">
          <div className="bg-[#10b981] p-6 h-full text-white flex flex-col transition-transform group-hover:scale-[1.02]">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <TrendingUp size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-semibold opacity-90">Funded Account</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-4xl font-bold">{propAccount ? \`P\${propAccount.currentPhase}\` : 'N/A'}</p>
              <span className="text-sm opacity-80">{propAccount?.status === 'funded' ? 'Live' : 'Evaluation'}</span>
            </div>
            <div className="mt-6 flex items-center text-sm font-medium opacity-90 group-hover:opacity-100 transition whitespace-nowrap">
              Log Trade <ArrowRight size={16} className="ml-1" />
            </div>
          </div>
        </Link>`;

  content = content.substring(0, todoCardEnd) + tradingCard + content.substring(todoCardEnd);
} else {
  throw new Error("Could not find Todo Card end");
}

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully added Trading card to Dashboard');

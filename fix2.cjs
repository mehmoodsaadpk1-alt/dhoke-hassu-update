const fs = require('fs');
let content = fs.readFileSync('src/components/AppShell.tsx', 'utf-8');

const target = '              onClick={handleDetectLocation}\n              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${\n  const renderPost = (post: any) => {';

const replacement = `              onClick={handleDetectLocation}
              className={\`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer \${
                composerLocation ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }\`}
            >
              📍 <span>{composerLocation || (currentLanguage === 'en' ? 'Location' : 'مقام')}</span>
            </button>
          </div>
          <button 
            type="submit" 
            disabled={!composerText.trim() && !composerImagePreview}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentLanguage === 'en' ? 'Post' : 'پوسٹ کریں'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderPost = (post: any) => {`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/AppShell.tsx', content, 'utf-8');
console.log('done fixing AppShell');

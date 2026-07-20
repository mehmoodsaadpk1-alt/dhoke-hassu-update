import fs from 'fs';
let code = fs.readFileSync('src/components/AppShell.tsx', 'utf-8');

// Find the rogue renderPost and renderPostComposer inside the stories map
const rogueRegex = /  const renderPost = \(post: any\) => \{[\s\S]*?setShowEmojiTray=\{setShowEmojiTray\}\n      \/>\n    \);\n  \};/g;

const matched = code.match(rogueRegex);
if (matched) {
  code = code.replace(rogueRegex, 
    "                </button>\n" +
    "                <span className=\"text-[10px] font-black text-slate-600 mt-2 truncate max-w-[70px] text-center\">\n" +
    "                  {story.author}\n" +
    "                </span>\n" +
    "              </div>\n" +
    "            );\n" +
    "          })}\n" +
    "        </div>\n" +
    "      </div>\n"
  );
  
  // Now inject them before the main AppShell return
  // AppShell main return is usually preceded by hooks/effects
  // Let's inject right before "return (" that has "  return (" and "<div className=\"min-h-screen"
  const mainReturnRegex = /  return \([\s\S]*?<div className="min-h-screen/g;
  code = code.replace(mainReturnRegex, matched[0] + '\n\n' + "$&");
  
  fs.writeFileSync('src/components/AppShell.tsx', code);
  console.log("FIXED!");
} else {
  console.log("NOT FOUND!");
}

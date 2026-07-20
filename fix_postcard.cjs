const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AppShell.tsx');
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Lines 5165-5214 need to be replaced (0-indexed: 5164-5213)
// The elements.push starts at line 5165 (0-indexed 5164)
// and ends with ); at line 5214 (0-indexed 5213)

const fixStart = 5164; // 0-indexed = line 5165
const fixEnd = 5213;   // 0-indexed = line 5214

console.log('Replacing lines ' + (fixStart+1) + ' to ' + (fixEnd+1));
console.log('First line: ' + lines[fixStart]);
console.log('Last line: ' + lines[fixEnd]);

const newPostCard = [
`                      elements.push(`,
`                        <div key={post.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">`,
`                          {/* Post Header */}`,
`                          <div className="flex items-start justify-between p-4 pb-2">`,
`                            <div className="flex items-center gap-3">`,
`                              <ClickableAvatar`,
`                                userId={post.author_id || post.authorId}`,
`                                name={post.author || post.authorName}`,
`                                avatar={post.avatar || post.authorAvatar}`,
`                              />`,
`                              <div>`,
`                                <div className="flex items-center gap-1">`,
`                                  <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-1">`,
`                                    <ClickableAvatar`,
`                                      userId={post.author_id || post.authorId}`,
`                                      name={post.author || post.authorName}`,
`                                      showName={true}`,
`                                      nameClassName="font-extrabold text-slate-900 text-sm"`,
`                                    />`,
`                                    {isEntityVerified(post.author || post.authorName) && (`,
`                                      <TvsBadge badgeType={getTvsBadgeType(post.author || post.authorName)} />`,
`                                    )}`,
`                                  </h5>`,
`                                </div>`,
`                                <p className="text-[10px] text-slate-400 font-semibold">`,
`                                  {post.timestamp || (post.created_at ? new Date(post.created_at).toLocaleDateString() : '')}`,
`                                  {post.area && <span className="ml-1">• 📍 {post.area}</span>}`,
`                                </p>`,
`                              </div>`,
`                            </div>`,
`                          </div>`,
``,
`                          {/* Post Content */}`,
`                          {post.content && (`,
`                            <div className="px-4 pb-3">`,
`                              <p className="text-slate-800 text-sm font-semibold leading-relaxed whitespace-pre-wrap">{post.content}</p>`,
`                            </div>`,
`                          )}`,
``,
`                          {/* Post Image */}`,
`                          {post.image && (`,
`                            <div className="overflow-hidden">`,
`                              <img src={post.image} alt="Post" className="w-full h-auto object-cover max-h-96" />`,
`                            </div>`,
`                          )}`,
``,
`                          {/* Post Actions */}`,
`                          <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-100">`,
`                            <button`,
`                              onClick={() => handleLikePost(post.id)}`,
`                              className={\`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer \${isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}\`}`,
`                            >`,
`                              <Heart className={\`w-4 h-4 \${isLiked ? 'fill-red-500' : ''}\`} />`,
`                              <span>{count}</span>`,
`                            </button>`,
`                            <button`,
`                              onClick={() => setExpandedComments((prev: any) => ({...prev, [post.id]: !prev[post.id]}))}`,
`                              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-500 transition-all cursor-pointer"`,
`                            >`,
`                              <MessageCircle className="w-4 h-4" />`,
`                              <span>{(post.comments || []).length}</span>`,
`                            </button>`,
`                          </div>`,
``,
`                          {/* Comments Section */}`,
`                          {expandedComments[post.id] && (`,
`                            <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">`,
`                              {(post.comments || []).map((comment: any, idx: number) => (`,
`                                <div key={idx} className="flex gap-2">`,
`                                  <div className="space-y-0.5 flex-1">`,
`                                    <div className="flex items-center gap-1">`,
`                                      <h5 className="font-extrabold text-slate-900 flex items-center gap-1">`,
`                                        <ClickableAvatar userId={comment.userId} name={comment.author} showName={true} nameClassName="font-extrabold text-slate-900" />`,
`                                        {isEntityVerified(comment.author) && (`,
`                                          <TvsBadge badgeType={getTvsBadgeType(comment.author)} />`,
`                                        )}`,
`                                      </h5>`,
`                                      <span className="text-[9px] text-slate-400">•</span>`,
`                                      <span className="text-[9px] text-slate-400">{comment.time}</span>`,
`                                    </div>`,
`                                    <p className="text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">{comment.content}</p>`,
`                                  </div>`,
`                                </div>`,
`                              ))}`,
``,
`                              {/* Write Comment Form */}`,
`                              <div className="flex gap-2 items-center pt-1.5">`,
`                                <input`,
`                                  type="text"`,
`                                  value={commentInputs[post.id] || ''}`,
`                                  onChange={(e) => setCommentInputs((prev: any) => ({ ...prev, [post.id]: e.target.value }))}`,
`                                  onKeyDown={(e) => { if (e.key === 'Enter') { handleCommentAdd(post.id); } }}`,
`                                  placeholder={currentLanguage === 'en' ? "Write a comment..." : "\u0627\u067e\u0646\u06cc \u0631\u0627\u0626\u06d2 \u0644\u06a9\u06be\u06cc\u06ba..."}`,
`                                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-semibold"`,
`                                />`,
`                                <button`,
`                                  onClick={() => handleCommentAdd(post.id)}`,
`                                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all cursor-pointer border-0 shadow-xs flex items-center justify-center"`,
`                                >`,
`                                  <Send className="w-3.5 h-3.5" />`,
`                                </button>`,
`                              </div>`,
`                            </div>`,
`                          )}`,
`                        </div>`,
`                      );`,
];

lines.splice(fixStart, fixEnd - fixStart + 1, ...newPostCard);
fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
console.log('Fixed! Replaced lines ' + (fixStart+1) + '-' + (fixEnd+1) + ' with ' + newPostCard.length + ' lines.');

// Verify
const newLines = fs.readFileSync(filePath, 'utf-8').split('\n');
console.log('New total lines: ' + newLines.length);
for (let i = fixStart - 2; i <= fixStart + 3; i++) {
  console.log((i+1) + ': ' + newLines[i]);
}

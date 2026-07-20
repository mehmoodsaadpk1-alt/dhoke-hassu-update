const fs = require('fs');
let content = fs.readFileSync('src/components/AppShell.tsx', 'utf-8');

const deletedCode = `        {composerImagePreview && (
          <div className="relative ml-12 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 mb-3">
            <img src={composerImagePreview} alt="Selected upload" className="w-full h-auto object-contain block" />
            <button 
              onClick={() => {
                setComposerImage(null);
                setComposerImagePreview(null);
              }}
              className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {composerLocation !== null && (
          <div className="flex items-center ml-12 mb-3 max-w-[240px]" id="composer-location-input-container">
            <div className="relative flex-1 flex items-center">
              <MapPin className="absolute left-3 w-4 h-4 text-blue-500 shrink-0" />
              <select
                value={composerLocation}
                onChange={(e) => {
                  const areaName = e.target.value;
                  setComposerLocation(areaName);
                  const matched = STATIC_AREAS.find(a => a.name === areaName);
                  if (matched) {
                    setComposerAreaId(matched.id);
                    setComposerLatitude(matched.latitude);
                    setComposerLongitude(matched.longitude);
                  }
                }}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-semibold appearance-none"
                id="composer-location-input"
              >
                {STATIC_AREAS.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button 
                onClick={() => {
                  setComposerLocation(null);
                  setComposerAreaId(null);
                  setComposerLatitude(null);
                  setComposerLongitude(null);
                }}
                className="absolute right-2.5 p-1 hover:bg-slate-200 text-slate-450 hover:text-slate-650 rounded-full transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center"
                title="Remove location"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-slate-200/40">
              <Camera className="w-4 h-4 text-emerald-500" />
              <span>📷 {currentLanguage === 'en' ? 'Photo' : 'تصویر'}</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleComposerImageChange} 
                className="hidden" 
              />
            </label>
            
            {/* UI Placeholder Buttons */}
            <button type="button" className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold border border-transparent cursor-not-allowed" disabled>
              🎥 <span>Video</span>
            </button>
            <button 
              type="button" 
              onClick={handleDetectLocation}
              className={\`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer \${
                composerLocation !== null ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
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

const target = `                  </option>
                ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-slate-200/40">
              <Camera className="w-4 h-4 text-emerald-500" />
              <span>📷 {currentLanguage === 'en' ? 'Photo' : 'تصویر'}</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleComposerImageChange} 
                className="hidden" 
              />
            </label>
            
            {/* UI Placeholder Buttons */}
            <button type="button" className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-xs font-bold border border-transparent cursor-not-allowed" disabled>
              🎥 <span>Video</span>
            </button>
            <button 
              type="button" 
              onClick={handleDetectLocation}
              className={\`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer \${
  const renderPost = (post: any) => {`;

content = content.replace(target, deletedCode);
fs.writeFileSync('src/components/AppShell.tsx', content, 'utf-8');
console.log('Fixed AppShell.tsx');

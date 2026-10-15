from pathlib import Path
path = Path('src/pages/Products.tsx')
text = path.read_text(encoding='utf-8')
needle = '''                />

              </div>


              {/* Filters bar */}'''
replacement = '''                />

              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 mx-auto max-w-lg md:max-w-none md:mx-0 fade-up-4">
                <button
                  type="button"
                  onClick={() => setSelectedHighlight(selectedHighlight === 'liveSpecial' ? '' : 'liveSpecial')}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition-transform duration-300 ${selectedHighlight === 'liveSpecial' ? 'bg-gradient-to-r from-orange-500 to-pink-500 scale-105' : 'bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 hover:scale-105 hover:shadow-xl'}`}
                >
                  Live Special
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHighlight(selectedHighlight === 'new' ? '' : 'new')}
                  className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-transform duration-300 ${selectedHighlight === 'new' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 scale-105' : 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:scale-105 hover:shadow-xl'}`}
                >
                  New Arrival
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white animate-bounce" />
                </button>
              </div>

              {/* Filters bar */}'''
if needle not in text:
    raise SystemExit('needle not found')
path.write_text(text.replace(needle, replacement), encoding='utf-8')
print('patched')

function App() {
  return (
    <div className="gradient-primary-subtle min-h-screen p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-600 mb-2">
            Web Content Scraper
          </h1>
          <p className="text-secondary-600">
            Extract and export structured content from any webpage
          </p>
        </div>

        {/* Action Card */}
        <div className="card-luxe p-6 mb-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Quick Actions
          </h2>
          
          <div className="space-y-3">
            <button className="btn-primary w-full">
              Scrape Page
            </button>
            
            <button className="btn-accent w-full">
              Export Results
            </button>
            
            <button className="btn-secondary w-full">
              View Settings
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className="card p-4">
          <div className="flex items-center gap-3 status-success">
            <div className="w-3 h-3 bg-success-500 rounded-full"></div>
            <span className="text-sm font-medium">Ready to scrape</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
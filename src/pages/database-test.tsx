import { useState } from 'react'
import { testDatabaseConnection, seedInitialData } from '@/lib/database-test'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Database, CheckCircle, XCircle, Play } from 'lucide-react'

export function DatabaseTestPage() {
  const [testing, setTesting] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [seedResults, setSeedResults] = useState<any>(null)

  const runTests = async () => {
    setTesting(true)
    const results = await testDatabaseConnection()
    setTestResults(results)
    setTesting(false)
  }

  const runSeeding = async () => {
    setSeeding(true)
    const results = await seedInitialData()
    setSeedResults(results)
    setSeeding(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🗄️ Database Setup & Testing
          </h1>
          <p className="text-gray-600">
            Test your Supabase connection and setup initial data
          </p>
        </div>

        {/* Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database Connection Test
            </CardTitle>
            <CardDescription>
              Verify that all tables exist and are accessible
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={runTests} disabled={testing} className="mb-4">
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Test Database Connection
                </>
              )}
            </Button>

            {testResults && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {testResults.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {testResults.success ? 'Connection Successful' : 'Connection Failed'}
                  </span>
                </div>

                {testResults.tables && (
                  <div className="grid grid-cols-2 gap-2">
                    {testResults.tables.map((table: any) => (
                      <div key={table.table} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-mono text-sm">{table.table}</span>
                        <Badge variant={table.status === 'exists' ? 'default' : 'destructive'}>
                          {table.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {testResults.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <strong>Error:</strong> {testResults.error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sample Data Seeding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Seed Sample Data
            </CardTitle>
            <CardDescription>
              Add sample businesses and coupons for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runSeeding} 
              disabled={seeding || !testResults?.allTablesExist}
              variant="secondary"
              className="mb-4"
            >
              {seeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Data...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Seed Sample Data
                </>
              )}
            </Button>

            {!testResults?.allTablesExist && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm mb-4">
                ⚠️ Please run the database test first and ensure all tables exist
              </div>
            )}

            {seedResults && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {seedResults.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {seedResults.success ? 'Sample Data Created' : 'Seeding Failed'}
                  </span>
                </div>

                {seedResults.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    <strong>Error:</strong> {seedResults.error}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Database Schema Setup</CardTitle>
            <CardDescription>
              If tables are missing, apply the schema in your Supabase dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">Setup Steps:</h3>
              <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
                <li>Go to <a href="https://supabase.com/dashboard/project/lziayzusujlvhebyagdl" className="underline" target="_blank" rel="noopener noreferrer">your Supabase dashboard</a></li>
                <li>Navigate to the SQL Editor</li>
                <li>Copy the schema from <code>supabase-schema.sql</code></li>
                <li>Paste and run the SQL commands</li>
                <li>Return here and test the connection</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
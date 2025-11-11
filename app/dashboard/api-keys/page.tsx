'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Eye, Copy, Trash2 } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  keyHash: string
  keyPrefix?: string  // First few characters of the key for display
  permissions: string[]
  lastUsedAt: string | null
  createdAt: string
  expiresAt: string | null
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.log('No auth token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      alert('Please enter a name for the API key')
      return
    }

    setCreating(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        throw new Error('Please log in first')
      }

      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newKeyName,
          permissions: ['read', 'purchase'],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create API key')
      }

      const data = await response.json()
      setNewKeyValue(data.key)
      setNewKeyName('')
      fetchApiKeys()
      toast.success('API key created successfully!')
    } catch (error) {
      console.error('Failed to create API key:', error)
      toast.error('Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKey = async (id: string) => {
    // Use toast.promise for confirmation-style interaction
    toast.promise(
      new Promise<void>((resolve, reject) => {
        if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
          reject(new Error('Cancelled'))
          return
        }

        const token = localStorage.getItem('auth_token')
        if (!token) {
          reject(new Error('Please log in first'))
          return
        }

        fetch(`/api/api-keys/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Failed to delete API key')
            }
            fetchApiKeys()
            resolve()
          })
          .catch(reject)
      }),
      {
        loading: 'Deleting API key...',
        success: 'API key deleted successfully',
        error: (err) => err.message === 'Cancelled' ? null : 'Failed to delete API key',
      }
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">API Keys</h1>
        <p className="mt-2 text-muted-foreground">
          Manage API keys for programmatic access to DataNexus
        </p>
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button className="mb-6">Create New API Key</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access. Make sure to copy it - you won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My AI Agent"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            {newKeyValue && (
              <div className="space-y-2">
                <Label>Your API Key (copy it now!)</Label>
                <div className="flex gap-2">
                  <Input value={newKeyValue} readOnly className="font-mono text-sm" />
                  <Button onClick={() => copyToClipboard(newKeyValue)}>Copy</Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  ⚠️ This key will only be shown once. Make sure to copy it now!
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            {!newKeyValue ? (
              <>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateKey} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Key'}
                </Button>
              </>
            ) : (
              <Button onClick={() => {
                setNewKeyValue(null)
                setShowDialog(false)
              }}>
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* API Keys List */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      )}

      {!loading && apiKeys.length === 0 && (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-6xl">🔑</div>
            <CardTitle>No API Keys Yet</CardTitle>
            <CardDescription>
              Create an API key to access DataNexus programmatically
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!loading && apiKeys.length > 0 && (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{apiKey.name}</CardTitle>
                    <CardDescription className="mt-2">
                      Created on {formatDate(apiKey.createdAt)}
                      {apiKey.lastUsedAt && (
                        <> · Last used {formatDate(apiKey.lastUsedAt)}</>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Display masked API key */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="flex gap-2 items-center">
                      <code className="flex-1 bg-muted p-2 rounded text-xs font-mono">
                        {apiKey.keyPrefix || 'sk_'}••••••••••••••••••••••••••••
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const maskedKey = `${apiKey.keyPrefix || 'sk_'}••••••••••••••••••••••••••••`
                          copyToClipboard(maskedKey)
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ For security, only the prefix is shown. The full key was displayed once when created.
                    </p>
                  </div>

                  {/* Permissions */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Permissions</Label>
                    <div className="flex flex-wrap gap-2">
                      {apiKey.permissions.map((permission) => (
                        <Badge key={permission} variant="secondary">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* API Documentation */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Using Your API Key</CardTitle>
          <CardDescription>
            Include your API key in the Authorization header as a Bearer token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold">Example Request</h3>
            <pre className="rounded-md bg-muted p-4 text-sm overflow-x-auto">
              <code>{`curl http://localhost:3000/api/agent/datasets \\
  -H "Authorization: Bearer your_api_key_here"`}</code>
            </pre>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Available Agent Endpoints</h3>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>GET /api/agent/datasets - Search datasets</li>
              <li>GET /api/agent/datasets/:id - Get dataset details</li>
              <li>POST /api/agent/datasets/:id/purchase - Purchase a dataset (x402)</li>
              <li>POST /api/agent/datasets/:id/analyze - Analyze dataset with EigenAI</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Python SDK Example</h3>
            <pre className="rounded-md bg-muted p-4 text-sm overflow-x-auto">
              <code>{`from x402_example import DataNexusClient

client = DataNexusClient(
    api_key="your_api_key_here",
    base_url="http://localhost:3000"
)

# Search datasets
datasets = client.search_datasets(query="crypto", limit=10)

# Analyze dataset with EigenAI
result = client.analyze_dataset(
    dataset_id="...",
    prompt="Analyze market sentiment",
    analysis_type="sentiment"
)`}</code>
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


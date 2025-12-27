"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TitleCard } from "@/components/ui/title-card"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

interface Model {
  id: string
  name: string
  pricing?: {
    prompt?: string
    completion?: string
  }
}

interface ModelsByProvider {
  [provider: string]: Model[]
}

export default function OpenRouterSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    apiKey: "",
    defaultModel: "openai/gpt-4o-mini",
    maxTokens: "4096",
    temperature: "0.7",
    isActive: true,
  })

  // Extract provider from model ID (e.g., "openai/gpt-4" -> "openai")
  const getProvider = (modelId: string): string => {
    const parts = modelId.split("/")
    return parts[0] || "other"
  }

  // Format provider name (capitalize, handle special cases)
  const formatProviderName = (provider: string): string => {
    const formatted = provider
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
    return formatted
  }

  // Group models by provider and filter by search
  const { freeModelsByProvider, paidModelsByProvider } = useMemo(() => {
    const free: ModelsByProvider = {}
    const paid: ModelsByProvider = {}
    
    const query = searchQuery.toLowerCase()
    const filteredModels = models.filter(
      (model) =>
        !query ||
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        getProvider(model.id).toLowerCase().includes(query)
    )

    filteredModels.forEach((model) => {
      const hasFreeSuffix = model.id.endsWith(":free")
      const hasZeroPricing = !model.pricing || 
                    (model.pricing.prompt === "0" && (!model.pricing.completion || model.pricing.completion === "0"))
      const isFree = hasFreeSuffix || hasZeroPricing
      
      const provider = getProvider(model.id)
      const target = isFree ? free : paid
      
      if (!target[provider]) {
        target[provider] = []
      }
      target[provider].push(model)
    })

    // Sort providers alphabetically
    const sortProviders = (obj: ModelsByProvider) => {
      return Object.keys(obj)
        .sort()
        .reduce((sorted, key) => {
          sorted[key] = obj[key].sort((a, b) => a.name.localeCompare(b.name))
          return sorted
        }, {} as ModelsByProvider)
    }

    return {
      freeModelsByProvider: sortProviders(free),
      paidModelsByProvider: sortProviders(paid),
    }
  }, [models, searchQuery])

  useEffect(() => {
    fetchSettings()
    fetchModels()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/settings/open-router")
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      setFormData({
        apiKey: "", // Never populate API key field for security
        defaultModel: data.defaultModel || "openai/gpt-4o-mini",
        maxTokens: data.maxTokens?.toString() || "4096",
        temperature: data.temperature?.toString() || "0.7",
        isActive: data.isActive !== undefined ? data.isActive : true,
      })
    } catch (error) {
      console.error("Error fetching Open Router settings:", error)
      setError("Failed to load Open Router settings")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchModels = async () => {
    try {
      setIsLoadingModels(true)
      const response = await fetch("https://openrouter.ai/api/v1/models")
      if (!response.ok) throw new Error("Failed to fetch models")
      const data = await response.json()
      const allModels: Model[] = data.data || []
      
      setModels(allModels)
    } catch (error) {
      console.error("Error fetching models:", error)
      // Don't show error to user, just use empty lists
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    try {
      setIsSaving(true)
      const response = await fetch("/api/settings/open-router", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      setSuccess("Open Router API settings saved successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error("Error saving Open Router settings:", error)
      setError(error.message || "Failed to save Open Router settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    setError(null)
    setSuccess(null)
    try {
      setIsTesting(true)
      const response = await fetch("/api/settings/open-router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "API connection test failed")
      }

      setSuccess(data.message || "Open Router API connection test successful")
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      console.error("Error testing Open Router API connection:", error)
      setError(error.message || "Failed to test Open Router API connection")
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Open Router API Settings" />
        <div className="space-y-6 mt-6">
          <TitleCard
            title="Open Router API Configuration"
            description="Configure your Open Router API settings for AI-powered features. Set up your API key, default model, and connection preferences."
          />
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Loading settings...</p>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Open Router API Settings" />
      <div className="space-y-6 mt-6">
        <TitleCard
          title="Open Router API Configuration"
          description="Configure your Open Router API settings for AI-powered features. Set up your API key, default model, and connection preferences."
        />
        <Card>
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                {success}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key *</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.apiKey ? "" : "Enter your Open Router API key. Leave blank to keep current key."}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Default Model</Label>
                  {isLoadingModels ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading models from OpenRouter...
                    </div>
                  ) : (
                    <Card className="border-2">
                      <CardContent className="p-0">
                        <div className="p-4 border-b">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search models by name, provider, or ID..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-2 text-sm font-medium">
                            Selected: <span className="text-primary font-semibold">
                              {models.find((m) => m.id === formData.defaultModel)?.name || formData.defaultModel}
                            </span>
                          </div>
                          <Tabs defaultValue="free" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="free">
                                Free Models
                                <Badge variant="success" className="ml-2 text-xs">
                                  {Object.values(freeModelsByProvider).flat().length}
                                </Badge>
                              </TabsTrigger>
                              <TabsTrigger value="paid">
                                Paid Models
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {Object.values(paidModelsByProvider).flat().length}
                                </Badge>
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="free" className="mt-4">
                              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {Object.keys(freeModelsByProvider).length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-8">
                                    {searchQuery ? "No free models found matching your search." : "No free models available."}
                                  </p>
                                ) : (
                                  Object.entries(freeModelsByProvider).map(([provider, providerModels]) => (
                                    <div key={provider} className="space-y-2">
                                      <h4 className="text-sm font-semibold text-foreground sticky top-0 bg-card py-2 border-b">
                                        {formatProviderName(provider)}
                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                          ({providerModels.length})
                                        </span>
                                      </h4>
                                      <div className="space-y-1 pl-2">
                                        {providerModels.map((model) => (
                                          <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, defaultModel: model.id })}
                                            className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                                              formData.defaultModel === model.id
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-accent"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium">{model.name}</span>
                                              <Badge variant="success" className="text-xs">Free</Badge>
                                            </div>
                                            <div className="text-xs opacity-70 mt-0.5 truncate">{model.id}</div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </TabsContent>
                            <TabsContent value="paid" className="mt-4">
                              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                                {Object.keys(paidModelsByProvider).length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-8">
                                    {searchQuery ? "No paid models found matching your search." : "No paid models available."}
                                  </p>
                                ) : (
                                  Object.entries(paidModelsByProvider).map(([provider, providerModels]) => (
                                    <div key={provider} className="space-y-2">
                                      <h4 className="text-sm font-semibold text-foreground sticky top-0 bg-card py-2 border-b">
                                        {formatProviderName(provider)}
                                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                                          ({providerModels.length})
                                        </span>
                                      </h4>
                                      <div className="space-y-1 pl-2">
                                        {providerModels.map((model) => (
                                          <button
                                            key={model.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, defaultModel: model.id })}
                                            className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                                              formData.defaultModel === model.id
                                                ? "bg-primary text-primary-foreground"
                                                : "hover:bg-accent"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium">{model.name}</span>
                                              <Badge variant="outline" className="text-xs">Paid</Badge>
                                            </div>
                                            <div className="text-xs opacity-70 mt-0.5 truncate">{model.id}</div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      placeholder="4096"
                      value={formData.maxTokens}
                      onChange={(e) => setFormData({ ...formData, maxTokens: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of tokens to generate in responses
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      placeholder="0.7"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls randomness (0.0 = deterministic, 2.0 = very creative)
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTest}
                    disabled={isTesting || isSaving}
                  >
                    {isTesting ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button type="submit" disabled={isSaving || isTesting}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}


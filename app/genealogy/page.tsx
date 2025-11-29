'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface GenealogyUser {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActivated: boolean;
  };
  level: number;
}

interface DownlineUser {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActivated: boolean;
  };
  level: number;
}

interface TreeNode {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActivated: boolean;
  };
  level: number;
  children: TreeNode[];
}

export default function GenealogyPage() {
  const [upline, setUpline] = useState<GenealogyUser[]>([]);
  const [downline, setDownline] = useState<DownlineUser[]>([]);
  const [directReferrals, setDirectReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upline' | 'downline' | 'journey' | 'tree'>('upline');
  const [journey, setJourney] = useState<GenealogyUser[] | null>(null);
  const [selectedDownlineUserId, setSelectedDownlineUserId] = useState<string>('');
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchGenealogy();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTree = async () => {
    setTreeLoading(true);
    try {
      const response = await fetch('/api/genealogy?type=tree');
      if (response.ok) {
        const data = await response.json();
        setTreeData(data.tree || null);
      } else {
        console.error('Failed to fetch tree');
        setTreeData(null);
      }
    } catch (error) {
      console.error('Error fetching tree:', error);
      setTreeData(null);
    } finally {
      setTreeLoading(false);
    }
  };

  const fetchGenealogy = async () => {
    try {
      const [uplineRes, downlineRes] = await Promise.all([
        fetch('/api/genealogy?type=upline'),
        fetch('/api/genealogy?type=downline'),
      ]);

      if (uplineRes.ok) {
        const uplineData = await uplineRes.json();
        setUpline(uplineData.genealogy || []);
      }

      if (downlineRes.ok) {
        const downlineData = await downlineRes.json();
        setDownline(downlineData.downline || []);
        setDirectReferrals(downlineData.directReferrals || []);
      }
    } catch (error) {
      console.error('Error fetching genealogy:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJourney = async (targetUserId: string) => {
    if (!targetUserId) {
      setJourney(null);
      return;
    }

    setJourneyLoading(true);
    try {
      const response = await fetch(
        `/api/genealogy?type=journey&journeyUserId=${targetUserId}`
      );
      if (response.ok) {
        const data = await response.json();
        setJourney(data.journey || null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to fetch journey');
        setJourney(null);
      }
    } catch (error) {
      console.error('Error fetching journey:', error);
      setJourney(null);
    } finally {
      setJourneyLoading(false);
    }
  };

  const handleJourneySearch = () => {
    if (selectedDownlineUserId) {
      fetchJourney(selectedDownlineUserId);
      setActiveTab('journey');
    }
  };


  // Tree Node Component
  const TreeNodeComponent = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
    const [expanded, setExpanded] = useState(depth < 2); // Auto-expand first 2 levels

    return (
      <div className="flex flex-col items-center relative">
        {/* Vertical line from parent */}
        {depth > 0 && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-gray-400" />
        )}
        
        <div className="flex flex-col items-center">
          <Card
            className={cn(
              "w-52 cursor-pointer transition-all hover:shadow-lg border-2",
              node.level === 0 && "border-primary bg-primary/10 shadow-md",
              !node.user.isActivated && "opacity-75 border-dashed"
            )}
            onClick={() => node.children.length > 0 && setExpanded(!expanded)}
          >
            <CardContent className="pt-4 pb-3 px-3">
              <div className="text-center">
                <div className="font-semibold text-sm mb-1">
                  {node.user.firstName} {node.user.lastName}
                </div>
                <div className="text-xs text-muted-foreground mb-2 truncate" title={node.user.email}>
                  {node.user.email}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                  <Badge 
                    variant={node.user.isActivated ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {node.user.isActivated ? '✓ Activated' : '✗ Inactive'}
                  </Badge>
                  {node.level > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Level {node.level}
                    </Badge>
                  )}
                </div>
                {node.children.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {node.children.length} direct referral{node.children.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {node.children.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? '▼ Collapse' : '▶ Expand'} ({node.children.length})
            </Button>
          )}
        </div>

        {expanded && node.children.length > 0 && (
          <div className="mt-6 relative flex justify-center">
            {/* Vertical line from parent */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-400" />
            
            <div className="flex justify-center gap-6 pt-6">
              {node.children.map((child, index) => (
                <div key={child.user._id} className="relative">
                  {/* Vertical line from horizontal connector to child */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-400" />
                  <TreeNodeComponent node={child} depth={depth + 1} />
                </div>
              ))}
            </div>
            
            {/* Horizontal line connecting all children (only if more than one) */}
            {node.children.length > 1 && (
              <div 
                className="absolute top-0 h-0.5 bg-gray-400"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `${(node.children.length - 1) * (208 + 24)}px`, // card width (208px = w-52) + gap (24px = gap-6)
                }}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 space-y-6">
      <h1 className="text-3xl font-bold">Genealogy Tree</h1>

      <Tabs 
        value={activeTab} 
        onValueChange={(v) => {
          const newTab = v as typeof activeTab;
          setActiveTab(newTab);
          if (newTab === 'tree' && !treeData && !treeLoading) {
            fetchTree();
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="upline">Upline ({upline.length})</TabsTrigger>
          <TabsTrigger value="downline">Downline ({downline.length})</TabsTrigger>
          <TabsTrigger value="tree">Tree View</TabsTrigger>
          <TabsTrigger value="journey">Journey to Downline</TabsTrigger>
        </TabsList>

        <TabsContent value="tree">
          <Card>
            <CardHeader>
              <CardTitle>Genealogy Tree View</CardTitle>
              <CardDescription>
                Visual representation of your downline network hierarchy. Click on nodes to expand or collapse branches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {treeLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Skeleton className="h-32 w-48" />
                  <Skeleton className="h-8 w-64" />
                </div>
              ) : treeData ? (
                <div className="overflow-auto p-8 min-h-[400px]">
                  <div className="flex justify-center">
                    <TreeNodeComponent node={treeData} />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tree data available.</p>
                  <Button
                    onClick={fetchTree}
                    className="mt-4"
                    variant="outline"
                  >
                    Load Tree View
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journey">
          <Card>
            <CardHeader>
              <CardTitle>Journey to Become Downline</CardTitle>
              <CardDescription>
                Select a downline member to see the path showing how they became part of your network.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Select
                  value={selectedDownlineUserId}
                  onValueChange={setSelectedDownlineUserId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a downline member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {downline.map((item) => (
                      <SelectItem key={item.user._id} value={item.user._id}>
                        {item.user.firstName} {item.user.lastName} ({item.user.email}) - Level {item.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleJourneySearch}
                  disabled={!selectedDownlineUserId || journeyLoading}
                >
                  {journeyLoading ? 'Loading...' : 'Show Journey'}
                </Button>
              </div>

              {journeyLoading ? (
                <div className="text-center py-8">
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : journey && journey.length > 0 ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      This shows the path from you to the selected downline member, showing how they became part of your network.
                    </AlertDescription>
                  </Alert>
              
              <div className="space-y-6">
                {/* Journey Path Visualization */}
                {journey.map((item, index) => (
                  <div key={item.user._id}>
                    <div className="flex items-start gap-4">
                      {/* Level Indicator */}
                      <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-white ${
                        item.level === 0 
                          ? 'bg-blue-600' 
                          : index === journey.length - 1
                          ? 'bg-green-600'
                          : 'bg-gray-500'
                      }`}>
                        {item.level === 0 ? 'You' : item.level}
                      </div>
                      
                      {/* User Card */}
                      <Card className={cn(
                        "flex-1",
                        item.level === 0 && "border-primary bg-primary/5",
                        index === journey.length - 1 && item.level !== 0 && "border-green-500 bg-green-50"
                      )}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-lg mb-1 flex items-center gap-2">
                                {item.user.firstName} {item.user.lastName}
                                {item.level === 0 && (
                                  <Badge variant="default">You - Starting Point</Badge>
                                )}
                                {index === journey.length - 1 && item.level !== 0 && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-900">Target Downline</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {item.user.email}
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant={item.user.isActivated ? 'default' : 'destructive'}>
                                  {item.user.isActivated ? '✓ Activated' : '✗ Not Activated'}
                                </Badge>
                                <div className="text-sm text-muted-foreground">
                                  Level {item.level} in your network
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Arrow between levels */}
                    {index < journey.length - 1 && (
                      <div className="flex justify-center my-3">
                        <div className="flex flex-col items-center">
                          <div className="text-blue-500 text-3xl font-bold">↓</div>
                          <div className="text-xs text-gray-500 mt-1 bg-blue-100 px-3 py-1 rounded">
                            Sponsored by {item.user.firstName} {item.user.lastName}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Journey Summary:</strong> This path shows {journey.length - 1} level(s) of sponsorship 
                      from you to the selected downline member. Each level represents a direct referral relationship.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : journey === null && selectedDownlineUserId ? (
                <div className="text-center py-8 text-muted-foreground">
                  No journey found. Please select a valid downline member.
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a downline member above to view their journey.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upline">
          <Card>
            <CardHeader>
              <CardTitle>Your Upline (Sponsors)</CardTitle>
            </CardHeader>
            <CardContent>
              {upline.length === 0 ? (
                <p className="text-muted-foreground">No upline found.</p>
              ) : (
                <div className="space-y-4">
                  {upline.map((item) => (
                    <Card key={item.user._id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold">
                              {item.user.firstName} {item.user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.user.email}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm font-medium text-muted-foreground">
                              Level {item.level === 0 ? '0 (You)' : item.level}
                            </div>
                            <Badge variant={item.user.isActivated ? 'default' : 'destructive'}>
                              {item.user.isActivated ? 'Activated' : 'Not Activated'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downline">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Direct Referrals ({directReferrals.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {directReferrals.length === 0 ? (
                  <p className="text-muted-foreground">No direct referrals yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {directReferrals.map((user) => (
                      <Card
                        key={user._id}
                        onClick={() => {
                          setSelectedDownlineUserId(user._id);
                          fetchJourney(user._id);
                          setActiveTab('journey');
                        }}
                        className="cursor-pointer hover:shadow-lg transition-all"
                      >
                        <CardContent className="pt-6">
                          <div className="font-semibold">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <Badge variant={user.isActivated ? 'default' : 'destructive'} className="mt-2">
                            {user.isActivated ? 'Activated' : 'Not Activated'}
                          </Badge>
                          <div className="text-xs text-primary mt-2">
                            Click to view journey →
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Complete Downline ({downline.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {downline.length === 0 ? (
                  <p className="text-muted-foreground">No downline members yet.</p>
                ) : (
                  <div className="space-y-2">
                    {downline.map((item) => (
                      <Card
                        key={item.user._id}
                        onClick={() => {
                          setSelectedDownlineUserId(item.user._id);
                          fetchJourney(item.user._id);
                          setActiveTab('journey');
                        }}
                        className="cursor-pointer hover:shadow-lg transition-all"
                      >
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-semibold">
                                {item.user.firstName} {item.user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.user.email}
                              </div>
                              <div className="text-xs text-primary mt-1">
                                Click to view journey →
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-sm font-medium text-muted-foreground">
                                Level {item.level}
                              </div>
                              <Badge variant={item.user.isActivated ? 'default' : 'destructive'}>
                                {item.user.isActivated ? 'Activated' : 'Not Activated'}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


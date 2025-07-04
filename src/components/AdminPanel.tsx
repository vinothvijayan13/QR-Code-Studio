import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  QrCode, 
  BarChart3, 
  Search, 
  Shield, 
  Calendar,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Activity,
  TrendingUp,
  Database
} from 'lucide-react';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { UserProfile } from '@/contexts/AuthContext';
import { QRData } from '@/contexts/QRContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const AdminPanel = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [qrCodes, setQrCodes] = useState<QRData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Load users
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setUsers(usersData);

      // Load all QR codes
      const qrQuery = query(collection(db, 'qrCodes'), orderBy('createdAt', 'desc'));
      const qrSnapshot = await getDocs(qrQuery);
      const qrData = qrSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QRData));
      setQrCodes(qrData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      // Also delete user's QR codes
      const userQRs = qrCodes.filter(qr => qr.userId === userId);
      for (const qr of userQRs) {
        await deleteDoc(doc(db, 'qrCodes', qr.id));
      }
      await loadAdminData();
      toast.success('User and their data deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: !currentStatus
      });
      await loadAdminData();
      toast.success(`Admin status ${!currentStatus ? 'granted' : 'revoked'} successfully`);
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  const deleteQRCode = async (qrId: string) => {
    try {
      await deleteDoc(doc(db, 'qrCodes', qrId));
      await loadAdminData();
      toast.success('QR code deleted successfully');
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast.error('Failed to delete QR code');
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber?.includes(searchTerm)
  );

  const filteredQRCodes = qrCodes.filter(qr =>
    qr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    totalQRCodes: qrCodes.length,
    totalScans: qrCodes.reduce((sum, qr) => sum + qr.scans, 0),
    activeUsers: users.filter(user => {
      const daysSinceLastLogin = user.lastLoginAt ? 
        (Date.now() - user.lastLoginAt.toDate().getTime()) / (1000 * 60 * 60 * 24) : 999;
      return daysSinceLastLogin <= 7;
    }).length,
    adminUsers: users.filter(user => user.isAdmin).length,
    avgQRsPerUser: users.length > 0 ? Math.round(qrCodes.length / users.length) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto mobile-padding py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl shadow-glow">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users and QR codes</p>
            </div>
          </div>
          <Button onClick={loadAdminData} variant="outline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Refresh Data
          </Button>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14 p-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-violet-100 dark:border-violet-800 shadow-medium">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-2 h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger 
              value="qrcodes" 
              className="flex items-center gap-2 h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <QrCode className="h-4 w-4" />
              QR Codes ({qrCodes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="hover-lift transition-smooth">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card className="hover-lift transition-smooth">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </CardContent>
              </Card>

              <Card className="hover-lift transition-smooth">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                  <Shield className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.adminUsers}</div>
                </CardContent>
              </Card>

              <Card className="hover-lift transition-smooth">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total QR Codes</CardTitle>
                  <QrCode className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.totalQRCodes}</div>
                </CardContent>
              </Card>

              <Card className="hover-lift transition-smooth">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                  <Eye className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.totalScans}</div>
                </CardContent>
              </Card>

              <Card className="hover-lift transition-smooth">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg QRs/User</CardTitle>
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-600">{stats.avgQRsPerUser}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.uid} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{user.displayName || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{user.email || user.phoneNumber}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {user.isAdmin && <Badge variant="destructive">Admin</Badge>}
                          <Badge variant="outline">
                            {user.createdAt ? format(user.createdAt.toDate(), 'MMM dd') : 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Recent QR Codes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {qrCodes.slice(0, 5).map((qr) => (
                      <div key={qr.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{qr.title}</p>
                          <p className="text-sm text-muted-foreground truncate">{qr.content}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{qr.type}</Badge>
                          <div className="text-sm text-muted-foreground">
                            {qr.scans} scans
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>QR Codes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.uid}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.displayName || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">ID: {user.uid.slice(0, 8)}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {user.email && <p className="text-sm">{user.email}</p>}
                              {user.phoneNumber && <p className="text-sm">{user.phoneNumber}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.createdAt ? format(user.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {user.lastLoginAt ? format(user.lastLoginAt.toDate(), 'MMM dd, yyyy') : 'Never'}
                          </TableCell>
                          <TableCell>
                            {qrCodes.filter(qr => qr.userId === user.uid).length}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {user.isAdmin && <Badge variant="destructive">Admin</Badge>}
                              <Badge variant={user.lastLoginAt && 
                                (Date.now() - user.lastLoginAt.toDate().getTime()) / (1000 * 60 * 60 * 24) <= 7 
                                ? "default" : "secondary"}>
                                {user.lastLoginAt && 
                                (Date.now() - user.lastLoginAt.toDate().getTime()) / (1000 * 60 * 60 * 24) <= 7 
                                ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant={user.isAdmin ? "destructive" : "default"}
                                onClick={() => toggleAdminStatus(user.uid, user.isAdmin || false)}
                                className="flex items-center gap-1"
                              >
                                {user.isAdmin ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                                {user.isAdmin ? 'Revoke' : 'Grant'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUser(user.uid)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qrcodes" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      QR Code Management
                    </CardTitle>
                    <CardDescription>View and manage all QR codes in the system</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search QR codes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>QR Code</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Scans</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQRCodes.map((qr) => {
                        const owner = users.find(user => user.uid === qr.userId);
                        return (
                          <TableRow key={qr.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                                  <QrCode className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{qr.title}</p>
                                  <p className="text-sm text-muted-foreground truncate max-w-xs">{qr.content}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{owner?.displayName || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{owner?.email || owner?.phoneNumber || 'No contact'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{qr.type.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell>
                              {qr.createdAt ? format(qr.createdAt.toDate(), 'MMM dd, yyyy') : 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{qr.scans}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteQRCode(qr.id)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
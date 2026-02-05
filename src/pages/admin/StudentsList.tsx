import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, User, Phone, Mail, Circle, Edit, X, Check, GraduationCap, UserPlus, MapPin, Clock, CheckCircle, XCircle, Trash2, Search, Users, ChevronDown, ChevronUp, Navigation } from "lucide-react";
import StudentLocationDialog from "@/components/StudentLocationDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const StudentsList = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRole } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    student_id_number: "",
    course: "",
    contact_number: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [locationStudent, setLocationStudent] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login?type=admin');
    } else if (userRole !== null && userRole !== 'admin') {
      navigate('/');
    }
  }, [user, authLoading, userRole, navigate]);

  useEffect(() => {
    if (!authLoading && user && userRole === 'admin') {
      fetchStudents();
    }
  }, [user, userRole, authLoading]);

  const fetchStudents = async () => {
    try {
      console.log('Fetching students as admin...');
      const { data, error } = await supabase
        .from('students' as any)
        .select('*')
        .order('created_at', { ascending: false }) as { data: any[]; error: any };

      console.log('Students fetch result:', { data, error });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast.error("Failed to load students: " + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Get student email - use stored email or fallback to auth email
  const getStudentEmail = (student: any) => {
    // If student has email stored, use that
    if (student.email) {
      return student.email;
    }
    // Fallback: try to get from user auth (via profiles or stored in students table)
    return student.auth_email || `${student.student_id_number?.replace(/[^a-zA-Z0-9]/g, '')}@student.isu.edu.ph`;
  };

  const handleEditClick = (student: any) => {
    setEditingStudent(student);
    setEditForm({
      full_name: student.full_name || "",
      student_id_number: student.student_id_number || "",
      course: student.course || "",
      contact_number: student.contact_number || "",
      address: student.address || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('students' as any)
        .update({
          full_name: editForm.full_name,
          student_id_number: editForm.student_id_number,
          course: editForm.course,
          contact_number: editForm.contact_number,
          address: editForm.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingStudent.id);

      if (error) throw error;

      toast.success("Student updated successfully!");
      setEditingStudent(null);
      fetchStudents();
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(error.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students' as any)
        .update({ is_approved: true, updated_at: new Date().toISOString() })
        .eq('id', studentId);

      if (error) throw error;
      toast.success("Student approved successfully!");
      fetchStudents();
    } catch (error: any) {
      console.error('Error approving student:', error);
      toast.error(error.message || "Failed to approve student");
    }
  };

  const handleReject = async (student: any) => {
    try {
      // Delete from students table
      const { error } = await supabase
        .from('students' as any)
        .delete()
        .eq('id', student.id);

      if (error) throw error;

      // Delete from auth if user_id exists
      if (student.user_id) {
        await supabase.functions.invoke('delete-auth-user', {
          body: { userId: student.user_id }
        });
      }

      toast.success("Student rejected and removed");
      fetchStudents();
    } catch (error: any) {
      console.error('Error rejecting student:', error);
      toast.error(error.message || "Failed to reject student");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      // Delete from students table
      const { error } = await supabase
        .from('students' as any)
        .delete()
        .eq('id', deleteConfirm.id);

      if (error) throw error;

      // Delete from auth if user_id exists
      if (deleteConfirm.user_id) {
        await supabase.functions.invoke('delete-auth-user', {
          body: { userId: deleteConfirm.user_id }
        });
      }

      toast.success("Student deleted successfully");
      setDeleteConfirm(null);
      fetchStudents();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(error.message || "Failed to delete student");
    } finally {
      setDeleting(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && !student.is_approved) || 
      (filter === 'approved' && student.is_approved);
    
    const matchesSearch = searchQuery.trim() === "" || 
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.course?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.year_level?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const pendingCount = students.filter(s => !s.is_approved).length;

  // Group students by course, year level, and section
  const groupedStudents = filteredStudents.reduce((groups, student) => {
    const course = student.course || 'No Course';
    const yearLevel = student.year_level || 'No Year';
    const section = student.section || 'No Section';
    const groupKey = `${course} - ${yearLevel} - ${section}`;
    
    if (!groups[groupKey]) {
      groups[groupKey] = {
        course,
        yearLevel,
        section,
        students: []
      };
    }
    groups[groupKey].students.push(student);
    return groups;
  }, {} as Record<string, { course: string; yearLevel: string; section: string; students: any[] }>);

  // Sort groups alphabetically
  const sortedGroupKeys = Object.keys(groupedStudents).sort();

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const expandAllGroups = () => {
    setExpandedGroups(new Set(sortedGroupKeys));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Students</h1>
                  <p className="text-xs text-muted-foreground">{students.length} registered</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/admin/register-student')}
              className="rounded-xl gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Student</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="rounded-full"
          >
            All ({students.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className={`rounded-full ${pendingCount > 0 ? 'border-amber-500 text-amber-600' : ''}`}
          >
            <Clock className="h-4 w-4 mr-1" />
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('approved')}
            className="rounded-full"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approved ({students.length - pendingCount})
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAllGroups}
            className="rounded-full text-xs"
          >
            Expand All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAllGroups}
            className="rounded-full text-xs"
          >
            Collapse All
          </Button>
        </div>

        {/* Group Stats */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {sortedGroupKeys.length} Groups
          </Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {filteredStudents.length} Students
          </Badge>
        </div>

        {filteredStudents.length === 0 ? (
          <Card className="text-center py-12 border-dashed">
            <CardContent>
              <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filter === 'pending' ? 'No Pending Students' : filter === 'approved' ? 'No Approved Students' : 'No Students Yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'pending' ? 'All students have been reviewed' : 'Register your first student to get started'}
              </p>
              {filter === 'all' && (
                <Button onClick={() => navigate('/admin/register-student')} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Register Student
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedGroupKeys.map((groupKey) => {
              const group = groupedStudents[groupKey];
              const isExpanded = expandedGroups.has(groupKey);
              const pendingInGroup = group.students.filter(s => !s.is_approved).length;
              
              return (
                <div key={groupKey} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md">
                        <GraduationCap className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold text-foreground">{group.course}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-xs font-medium">
                            {group.yearLevel}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-medium">
                            Section {group.section}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-2xl font-bold text-foreground">{group.students.length}</span>
                        <span className="text-sm text-muted-foreground ml-1">students</span>
                      </div>
                      {pendingInGroup > 0 && (
                        <Badge className="bg-amber-500 text-white">
                          {pendingInGroup} pending
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                  
                  {/* Expanded Students */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.students.map((student) => (
                          <Card key={student.id} className={`group hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden ${!student.is_approved ? 'ring-2 ring-amber-400/50' : ''}`}>
                            <CardContent className="p-0">
                              {/* Pending Badge */}
                              {!student.is_approved && (
                                <div className="bg-amber-500 text-white text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  Pending Approval
                                </div>
                              )}
                              {/* Top Section with gradient */}
                              <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-4 border-b border-border/50">
                                <div className="flex items-start gap-4">
                                  {student.photo_url ? (
                                    <img
                                      src={student.photo_url}
                                      alt={student.full_name}
                                      className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center border-2 border-white shadow-md">
                                      <span className="text-xl font-bold text-white">{student.full_name?.charAt(0) || '?'}</span>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-base font-bold text-foreground truncate">{student.full_name}</h3>
                                      {student.is_approved && (
                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                      )}
                                    </div>
                                    <Badge variant="secondary" className="text-xs font-mono mb-1">
                                      {student.student_id_number}
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8"
                                    onClick={() => handleEditClick(student)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Details Section */}
                              <div className="p-4 space-y-2.5">
                                <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{student.contact_number || 'No contact'}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-sm text-foreground/80">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium truncate">{getStudentEmail(student)}</span>
                                </div>
                                {student.address && (
                                  <div className="flex items-start gap-2.5 text-sm text-foreground/80">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <span className="font-medium line-clamp-2">{student.address}</span>
                                  </div>
                                )}
                                
                                {/* View Location Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setLocationStudent(student)}
                                  className="w-full mt-2 gap-2 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Navigation className="h-4 w-4" />
                                  View Live Location
                                </Button>
                                
                                {/* Approval Buttons */}
                                {!student.is_approved && (
                                  <div className="flex gap-2 pt-3 mt-3 border-t border-border/50">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApprove(student.id)}
                                      className="flex-1 rounded-lg gap-1.5 bg-green-500 hover:bg-green-600 font-semibold"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleReject(student)}
                                      className="flex-1 rounded-lg gap-1.5 font-semibold"
                                    >
                                      <XCircle className="h-4 w-4" />
                                      Reject
                                    </Button>
                                  </div>
                                )}

                                {/* Delete Button for approved students */}
                                {student.is_approved && (
                                  <div className="flex gap-2 pt-3 mt-3 border-t border-border/50">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDeleteConfirm(student)}
                                      className="w-full rounded-lg gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete Student
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Student
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-id">Student ID</Label>
              <Input
                id="edit-id"
                value={editForm.student_id_number}
                onChange={(e) => setEditForm({ ...editForm, student_id_number: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-course">Course</Label>
              <Input
                id="edit-course"
                value={editForm.course}
                onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact">Contact Number</Label>
              <Input
                id="edit-contact"
                value={editForm.contact_number}
                onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setEditingStudent(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="rounded-xl gap-2">
                <Check className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Student
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deleteConfirm?.full_name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={deleting}
              className="rounded-xl gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Location Dialog */}
      <StudentLocationDialog
        student={locationStudent}
        open={!!locationStudent}
        onOpenChange={(open) => !open && setLocationStudent(null)}
      />
    </div>
  );
};

export default StudentsList;
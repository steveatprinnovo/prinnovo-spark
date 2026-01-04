import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAuth } from "@/hooks/useAuth";
import { useAllVentureOfficeLogos } from "@/hooks/useVentureOfficeLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ExternalLink, Target, Building2, Star, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";

interface FocusAreaCompany {
  id: string;
  focus_area_id: string;
  company_name: string;
  website_url: string | null;
}

interface FocusArea {
  id: string;
  venture_office: string;
  focus_area_name: string;
  is_high_priority: boolean;
  companies: FocusAreaCompany[];
}

interface VentureOfficeGroup {
  venture_office: string;
  logoUrl: string | null;
  focusAreas: FocusArea[];
}

const FocusAreas = () => {
  usePageTitle("Focus Areas");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { logos: ventureOfficeLogos } = useAllVentureOfficeLogos();
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all focus areas with companies
  useEffect(() => {
    const fetchAllFocusAreas = async () => {
      try {
        setLoading(true);
        
        // Fetch all focus areas
        const { data: areasData, error: areasError } = await supabase
          .from('focus_areas')
          .select('*')
          .order('venture_office', { ascending: true })
          .order('focus_area_name', { ascending: true });

        if (areasError) throw areasError;

        if (!areasData || areasData.length === 0) {
          setFocusAreas([]);
          setLoading(false);
          return;
        }

        // Fetch all companies for these focus areas
        const areaIds = areasData.map(a => a.id);
        const { data: companiesData, error: companiesError } = await supabase
          .from('focus_area_companies')
          .select('*')
          .in('focus_area_id', areaIds)
          .order('company_name', { ascending: true });

        if (companiesError) throw companiesError;

        // Map companies to focus areas
        const areasWithCompanies: FocusArea[] = areasData.map(area => ({
          ...area,
          companies: (companiesData || []).filter(c => c.focus_area_id === area.id)
        }));

        setFocusAreas(areasWithCompanies);
      } catch (error) {
        console.error('Error fetching focus areas:', error);
        setFocusAreas([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllFocusAreas();
    }
  }, [user]);

  // Filter focus areas based on search query
  const filteredFocusAreas = useMemo(() => {
    if (!searchQuery.trim()) return focusAreas;

    const query = searchQuery.toLowerCase().trim();
    
    return focusAreas.filter(area => {
      // Check if focus area name matches
      if (area.focus_area_name.toLowerCase().includes(query)) return true;
      
      // Check if any company name matches
      if (area.companies.some(c => c.company_name.toLowerCase().includes(query))) return true;
      
      // Check if venture office matches
      if (area.venture_office.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }, [focusAreas, searchQuery]);

  // Group focus areas by venture office
  const groupedByVentureOffice = useMemo((): VentureOfficeGroup[] => {
    const groups: Record<string, FocusArea[]> = {};
    
    filteredFocusAreas.forEach(area => {
      const office = area.venture_office || 'Unknown';
      if (!groups[office]) {
        groups[office] = [];
      }
      groups[office].push(area);
    });

    return Object.entries(groups)
      .map(([venture_office, focusAreas]) => {
        const logoData = ventureOfficeLogos.find(l => l.name === venture_office);
        return {
          venture_office,
          logoUrl: logoData?.logoUrl || null,
          focusAreas
        };
      })
      .sort((a, b) => a.venture_office.localeCompare(b.venture_office));
  }, [filteredFocusAreas, ventureOfficeLogos]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Focus Areas</h1>
            <p className="text-muted-foreground">Strategic focus areas across all venture offices</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search focus areas or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {groupedByVentureOffice.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {searchQuery.trim() ? (
                <>
                  <p>No focus areas match your search.</p>
                  <p className="text-sm mt-2">Try adjusting your search terms.</p>
                </>
              ) : (
                <>
                  <p>No focus areas have been defined yet.</p>
                  <p className="text-sm mt-2">Focus areas can be added in the Settings page under Venture Office Updates.</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedByVentureOffice.map(group => (
              <div key={group.venture_office} className="space-y-4">
                <div className="flex items-center gap-3">
                  {group.logoUrl ? (
                    <img 
                      src={group.logoUrl} 
                      alt={group.venture_office} 
                      className="h-8 w-8 object-contain rounded"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-primary" />
                  )}
                  <h2 className="text-2xl font-semibold">{group.venture_office}</h2>
                  <Badge variant="secondary" className="ml-2">
                    {group.focusAreas.length} {group.focusAreas.length === 1 ? 'Focus Area' : 'Focus Areas'}
                  </Badge>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {group.focusAreas.map(area => (
                    <Card key={area.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Target className="h-4 w-4 text-primary" />
                          {area.focus_area_name}
                          {area.is_high_priority && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                              <Star className="h-3 w-3 fill-current" />
                              High Priority
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {area.companies.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No example companies</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                              Example Companies
                            </p>
                            <ul className="space-y-1.5">
                              {area.companies.map(company => (
                                <li key={company.id} className="flex items-center gap-2">
                                  {company.website_url ? (
                                    <a
                                      href={company.website_url.startsWith('http') ? company.website_url : `https://${company.website_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline flex items-center gap-1"
                                    >
                                      {company.company_name}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : (
                                    <span className="text-sm text-foreground">{company.company_name}</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusAreas;

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown, Zap, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAllCountries, type CountryOption } from "@/lib/countriesData";
import { cn } from "@/lib/utils";
import CountryFlag from "@/components/common/CountryFlag";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";

interface AddCountryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyMembers: Array<{ id: string; name: string }>;
  onSuccess: () => void;
  preSelectedCountry?: CountryOption;
}

const allCountries = getAllCountries();

const AddCountryModal = ({ 
  open, 
  onOpenChange, 
  familyMembers, 
  onSuccess,
  preSelectedCountry 
}: AddCountryModalProps) => {
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(preSelectedCountry || null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("quick");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedCountry(preSelectedCountry || null);
      // Default: all members selected
      setSelectedMembers(familyMembers.map(m => m.id));
      setActiveTab("quick");
    }
  }, [open, preSelectedCountry, familyMembers]);

  const handleCountrySelect = (countryOption: CountryOption) => {
    setSelectedCountry(countryOption);
    setComboboxOpen(false);
  };

  const handleQuickAdd = async () => {
    if (!selectedCountry) {
      toast({
        title: "Validation Error",
        description: "Please select a country",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "You must be logged in", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check if country already exists for this user
      const { data: existingCountry } = await supabase
        .from("countries")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", selectedCountry.name)
        .maybeSingle();

      let countryId: string;

      if (existingCountry) {
        countryId = existingCountry.id;
      } else {
        // Create the country
        const { data: newCountry, error } = await supabase
          .from("countries")
          .insert([{
            name: selectedCountry.name,
            flag: selectedCountry.code,
            continent: selectedCountry.continent,
            user_id: user.id
          }])
          .select()
          .single();

        if (error) throw error;
        countryId = newCountry.id;
      }

      // Add country visits for selected members
      if (selectedMembers.length > 0) {
        // First, get existing visits to avoid duplicates
        const { data: existingVisits } = await supabase
          .from("country_visits")
          .select("family_member_id")
          .eq("country_id", countryId)
          .eq("user_id", user.id);

        const existingMemberIds = new Set(existingVisits?.map(v => v.family_member_id) || []);
        const newMemberIds = selectedMembers.filter(id => !existingMemberIds.has(id));

        if (newMemberIds.length > 0) {
          const visits = newMemberIds.map(memberId => ({
            country_id: countryId,
            family_member_id: memberId,
            user_id: user.id
          }));
          
          const { error: visitsError } = await supabase
            .from("country_visits")
            .insert(visits);
          
          if (visitsError) throw visitsError;
        }
      }

      toast({ title: "Country added successfully!" });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error adding country:", error);
      toast({
        title: "Error",
        description: "Failed to add country",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddWithTrip = () => {
    if (!selectedCountry) {
      toast({
        title: "Validation Error",
        description: "Please select a country first",
        variant: "destructive",
      });
      return;
    }

    // Store selected country and members in sessionStorage for the trip wizard
    sessionStorage.setItem('tripPreselectedCountry', JSON.stringify({
      country: selectedCountry,
      memberIds: selectedMembers
    }));

    onOpenChange(false);
    navigate('/trips/new');
  };

  const toggleAllMembers = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(familyMembers.map(m => m.id));
    } else {
      setSelectedMembers([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Country</DialogTitle>
          <DialogDescription>
            Track a country your family has visited
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Country Selector */}
          <div>
            <Label>Country</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between mt-1"
                  type="button"
                >
                  {selectedCountry ? (
                    <span className="flex items-center gap-2">
                      <CountryFlag countryCode={selectedCountry.code} countryName={selectedCountry.name} size="sm" />
                      <span>{selectedCountry.name}</span>
                      <span className="text-muted-foreground text-xs">({selectedCountry.continent})</span>
                    </span>
                  ) : (
                    "Select country..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search country..." />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {allCountries.map((countryOption) => (
                        <CommandItem
                          key={countryOption.code}
                          value={countryOption.name}
                          onSelect={() => handleCountrySelect(countryOption)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCountry?.name === countryOption.name ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <CountryFlag countryCode={countryOption.code} countryName={countryOption.name} size="sm" className="mr-2" />
                          <span>{countryOption.name}</span>
                          <span className="ml-auto text-muted-foreground text-xs">{countryOption.continent}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Family Members Selection */}
          {familyMembers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Who visited?</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto py-1 px-2 text-xs"
                  onClick={() => toggleAllMembers(selectedMembers.length !== familyMembers.length)}
                >
                  {selectedMembers.length === familyMembers.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {familyMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/50">
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMembers([...selectedMembers, member.id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                        }
                      }}
                    />
                    <label
                      htmlFor={`member-${member.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {member.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Add
              </TabsTrigger>
              <TabsTrigger value="trip" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Add with Trip
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="quick" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Quickly mark this country as visited. Perfect for tracking past travels.
              </p>
              <Button 
                onClick={handleQuickAdd} 
                disabled={loading || !selectedCountry}
                className="w-full"
              >
                {loading ? "Adding..." : "Quick Add Country"}
              </Button>
            </TabsContent>
            
            <TabsContent value="trip" className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Create a detailed trip with dates, itinerary, and more. The country and selected members will be pre-filled.
              </p>
              <Button 
                onClick={handleAddWithTrip}
                disabled={!selectedCountry}
                className="w-full"
                variant="secondary"
              >
                Continue to Trip Planner
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddCountryModal;

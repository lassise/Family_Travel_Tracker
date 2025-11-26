import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe } from "lucide-react";

interface Country {
  id: string;
  name: string;
  flag: string;
  continent: string;
}

interface MemberCountriesDialogProps {
  memberName: string;
  countries: Country[];
  countriesCount: number;
}

const MemberCountriesDialog = ({ memberName, countries, countriesCount }: MemberCountriesDialogProps) => {
  // Group countries by continent
  const countriesByContinent = countries.reduce((acc, country) => {
    if (!acc[country.continent]) {
      acc[country.continent] = [];
    }
    acc[country.continent].push(country);
    return acc;
  }, {} as Record<string, Country[]>);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between hover:bg-primary/10">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Countries</span>
          </div>
          <Badge variant="secondary" className="font-bold">
            {countriesCount}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {memberName}'s Visited Countries
          </DialogTitle>
          <p className="text-muted-foreground">
            {countriesCount} {countriesCount === 1 ? 'country' : 'countries'} across {Object.keys(countriesByContinent).length} {Object.keys(countriesByContinent).length === 1 ? 'continent' : 'continents'}
          </p>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {Object.entries(countriesByContinent).sort(([a], [b]) => a.localeCompare(b)).map(([continent, continentCountries]) => (
              <div key={continent}>
                <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                  {continent}
                  <Badge variant="outline">{continentCountries.length}</Badge>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {continentCountries.sort((a, b) => a.name.localeCompare(b.name)).map((country) => (
                    <div
                      key={country.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <span className="text-sm font-medium">{country.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MemberCountriesDialog;

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle2, AlertCircle, Clock, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionRiskProps {
  layoverMinutes: number;
  hasTerminalChange?: boolean;
  hasAirportChange?: boolean;
  isInternational?: boolean;
  hasKids?: boolean;
  className?: string;
}

type RiskLevel = 'low' | 'medium' | 'high';

interface RiskAssessment {
  level: RiskLevel;
  label: string;
  description: string;
  recommendations: string[];
}

const assessConnectionRisk = ({
  layoverMinutes,
  hasTerminalChange = false,
  hasAirportChange = false,
  isInternational = false,
  hasKids = false,
}: ConnectionRiskProps): RiskAssessment => {
  // Base minimum times (in minutes)
  const baseMinimum = isInternational ? 120 : 60;
  const kidBuffer = hasKids ? 30 : 0;
  const terminalBuffer = hasTerminalChange ? 15 : 0;
  const airportChangeBuffer = hasAirportChange ? 120 : 0;
  
  const totalMinimum = baseMinimum + kidBuffer + terminalBuffer + airportChangeBuffer;
  const comfortableTime = totalMinimum * 1.5;
  
  const recommendations: string[] = [];
  
  if (hasAirportChange) {
    recommendations.push('This requires changing airports. Allow extra time for ground transport.');
  }
  if (hasTerminalChange) {
    recommendations.push('Terminal change required. Check if there\'s a shuttle or long walk.');
  }
  if (isInternational) {
    recommendations.push('International connection may require going through customs and security again.');
  }
  if (hasKids) {
    recommendations.push('With kids, extra buffer is recommended for bathroom breaks and snacks.');
  }
  
  if (layoverMinutes < totalMinimum) {
    return {
      level: 'high',
      label: 'Risky connection',
      description: `Only ${formatDuration(layoverMinutes)} layover. Minimum recommended: ${formatDuration(totalMinimum)}`,
      recommendations: [
        'High risk of missing your connection if first flight is delayed.',
        ...recommendations,
        'Consider booking separate tickets so you\'re not liable for missed connections.',
      ],
    };
  }
  
  if (layoverMinutes < comfortableTime) {
    return {
      level: 'medium',
      label: 'Tight connection',
      description: `${formatDuration(layoverMinutes)} layover. This is workable but tight.`,
      recommendations: [
        'Should be fine if first flight is on time.',
        'Sit near the front of the plane to deplane quickly.',
        ...recommendations,
      ],
    };
  }
  
  return {
    level: 'low',
    label: 'Comfortable',
    description: `${formatDuration(layoverMinutes)} layover. Plenty of time.`,
    recommendations: [
      'Good buffer for delays.',
      ...recommendations,
      layoverMinutes > 300 ? 'Long layover - consider exploring airport lounges or nearby attractions.' : '',
    ].filter(Boolean),
  };
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const ConnectionRiskIndicator = (props: ConnectionRiskProps) => {
  const { className } = props;
  const assessment = assessConnectionRisk(props);
  
  const getIcon = () => {
    switch (assessment.level) {
      case 'high':
        return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'medium':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'low':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
    }
  };
  
  const getVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (assessment.level) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
    }
  };
  
  const getColorClass = () => {
    switch (assessment.level) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline"
          className={cn(
            'cursor-help flex items-center gap-1',
            getColorClass(),
            className
          )}
        >
          {getIcon()}
          <span>{assessment.label}</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <div className="space-y-2">
          <p className="font-medium">{assessment.description}</p>
          
          {props.hasTerminalChange && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              Terminal change required
            </div>
          )}
          
          {props.hasAirportChange && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle className="h-3 w-3" />
              Airport change required
            </div>
          )}
          
          {assessment.recommendations.length > 0 && (
            <ul className="text-xs space-y-1">
              {assessment.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-muted-foreground">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export { ConnectionRiskIndicator, assessConnectionRisk };
export type { ConnectionRiskProps, RiskLevel };
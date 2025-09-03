import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface Company {
  "Company Name": string;
  "Country of Origin": string | null;
  "High-Level Focus Area": string | null;
  "Specific Focus Area": string | null;
  "Current Company Valuation": number | null;
  "Current HLV Valuation": number | null;
  "Pipeline Stage": string | null;
  "EVP Owner": string | null;
  "IPA Year": number | null;
  "Company Contact": string | null;
  "Champions": string | null;
  "Intro Origin": string | null;
  "HLV Ownership Percentage": string | null;
  "IPA Signature Date": string | null;
  "Term Sheet Signature Date": string | null;
  "Final Portfolio Decision Date": string | null;
  "Implementation Completion Date": string | null;
}

interface PortfolioChartProps {
  companies: Company[];
}

export function PortfolioChart({ companies }: PortfolioChartProps) {
  // Filter and sort companies by valuation
  const chartData = companies
    .filter(company => company["Current Company Valuation"] && company["Current Company Valuation"] > 0)
    .sort((a, b) => (b["Current Company Valuation"] || 0) - (a["Current Company Valuation"] || 0))
    .slice(0, 10) // Show top 10 companies
    .map(company => ({
      name: company["Company Name"],
      value: company["Current Company Valuation"] || 0,
      shortName: company["Company Name"].length > 15 
        ? company["Company Name"].substring(0, 12) + "..." 
        : company["Company Name"]
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-primary">
            Value: {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-primary" />
          Top Portfolio Companies by Valuation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <XAxis 
              dataKey="shortName" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              fontSize={12}
            />
            <YAxis 
              tickFormatter={(value) => 
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  notation: 'compact',
                  maximumFractionDigits: 0
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
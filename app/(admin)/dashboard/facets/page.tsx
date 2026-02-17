import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getFacets } from "@/services/facets";
import { FacetForm, FacetEditButton } from "@/components/admin/facet-form";
import { FacetValuesManager } from "@/components/admin/facet-values-manager";
import { FacetDeleteButton } from "@/components/admin/facet-actions";

export const metadata: Metadata = {
  title: "Manage Facets",
};

export default async function AdminFacetsPage() {
  const facets = await getFacets();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product attributes like Size, Color, Brand
          </p>
        </div>
        <FacetForm />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Values</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No facets yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              facets.map((facet) => (
                <TableRow key={facet.id}>
                  <TableCell className="font-medium">{facet.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{facet.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <FacetValuesManager
                      facetId={facet.id}
                      values={facet.values}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <FacetEditButton facet={facet} />
                      <FacetDeleteButton facetId={facet.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

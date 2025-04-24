'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface RecipeFormProps {
  binderId: string;
  binderTitle: string;
}

export default function RecipeForm({ binderId, binderTitle }: RecipeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    ingredients: '',
    instructions: '',
    notes: '',
    imageUrl: '',
    sourceUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          binderId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create recipe');
      }

      alert('Recipe added successfully!');
      router.push(`/binders/${binderId}`);
      router.refresh();
    } catch (error) {
      console.error('Error adding recipe:', error);
      alert(error instanceof Error ? error.message : 'Failed to add recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Recipe Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter recipe title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients</Label>
            <Textarea
              id="ingredients"
              name="ingredients"
              value={formData.ingredients}
              onChange={handleChange}
              placeholder="Enter ingredients, one per line"
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="Enter cooking instructions"
              rows={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="Enter URL for recipe image"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
            <Input
              id="sourceUrl"
              name="sourceUrl"
              value={formData.sourceUrl}
              onChange={handleChange}
              placeholder="Enter source URL"
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(`/binders/${binderId}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Recipe'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 
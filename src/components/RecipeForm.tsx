'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Recipe, Ingredient, Instruction } from '../types/recipe';

// Validation type for tracking field-specific errors
interface ValidationErrors {
  title?: string;
  ingredients?: string;
  instructions?: string;
  notes?: string;
  imageUrl?: string;
  sourceUrl?: string;
  cookingTime?: string;
  servings?: string;
}

interface RecipeFormProps {
  mode: 'create' | 'edit';
  initialData?: Recipe;
  binderId?: string;
  onSubmit: (data: Recipe) => Promise<void>;
  onCancel: () => void;
}

export default function RecipeForm({ 
  mode, 
  initialData, 
  binderId, 
  onSubmit,
  onCancel 
}: RecipeFormProps) {
  const [loading, setLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Recipe>(() => ({
    title: '',
    description: '',
    cookingTime: null,
    servings: null,
    notes: '',
    sourceUrl: '',
    ingredients: [{ name: '', amount: 0, unit: 'g', notes: '' }],
    instructions: [{ step: 1, text: '', time: undefined }],
    ...initialData,
    // Convert string values to numbers if they exist
    ...(initialData?.cookingTime !== undefined && {
      cookingTime: Number(initialData.cookingTime) || null
    }),
    ...(initialData?.servings !== undefined && {
      servings: Number(initialData.servings) || null
    }),
    // Initialize imageUrl from thumbnail or imageUrl
    imageUrl: initialData?.thumbnail || initialData?.imageUrl || ''
  }));
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Available unit options
  const unitOptions = ['g', 'kg', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'ml', 'l', 'piece', 'pinch', 'to taste'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'cookingTime' || name === 'servings' 
        ? (value === '' ? null : Number(value))
        : value 
    }));
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle ingredient change
  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { 
      ...newIngredients[index], 
      [field]: field === 'amount' ? Number(value) || 0 : value 
    };
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
    
    // Clear ingredient errors when user edits
    if (errors.ingredients) {
      setErrors(prev => ({ ...prev, ingredients: undefined }));
    }
  };

  // Handle instruction change
  const handleInstructionChange = (index: number, field: keyof Instruction, value: string | number) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = { 
      ...newInstructions[index], 
      [field]: field === 'time' ? (Number(value) || undefined) : 
               field === 'step' ? Number(value) : value 
    };
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
    
    // Clear instruction errors when user edits
    if (errors.instructions) {
      setErrors(prev => ({ ...prev, instructions: undefined }));
    }
  };

  // Add new ingredient
  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        { name: '', amount: 0, unit: 'g', notes: '' }
      ]
    }));
  };

  // Remove ingredient at index
  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Add new instruction step
  const addInstruction = () => {
    setFormData(prev => {
      const nextStep = prev.instructions.length > 0 
        ? Math.max(...prev.instructions.map(i => i.step)) + 1 
        : 1;
      return {
        ...prev,
        instructions: [
          ...prev.instructions,
          { step: nextStep, text: '', time: undefined }
        ]
      };
    });
  };

  // Remove instruction at index
  const removeInstruction = (index: number) => {
    setFormData(prev => {
      const newInstructions = prev.instructions.filter((_, i) => i !== index);
      // Re-number steps to be sequential
      const renumbered = newInstructions.map((instr, idx) => ({
        ...instr,
        step: idx + 1
      }));
      return {
        ...prev,
        instructions: renumbered
      };
    });
  };

  // Handle image file upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Store the current file
    setCurrentFile(file);
    setUploadingImage(true);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // Update form data with new image URL
        setFormData(prev => ({
          ...prev,
          imageUrl: data.url
        }));
      } else {
        alert(data.error || 'Failed to upload image');
        // Reset file input if upload failed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setCurrentFile(null);
      }
    } catch (err) {
      alert('Failed to upload image');
      // Reset file input if upload failed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setCurrentFile(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image handler
  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setCurrentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
      isValid = false;
    }

    // Ingredients validation
    if (formData.ingredients.length === 0) {
      newErrors.ingredients = 'At least one ingredient is required';
      isValid = false;
    } else {
      const invalidIngredient = formData.ingredients.find(
        ing => !ing.name.trim() || ing.amount === undefined || ing.amount < 0 || !ing.unit
      );
      if (invalidIngredient) {
        newErrors.ingredients = 'All ingredients must have a name, amount (≥ 0), and unit';
        isValid = false;
      }
    }

    // Instructions validation
    if (formData.instructions.length === 0) {
      newErrors.instructions = 'At least one instruction is required';
      isValid = false;
    } else {
      const invalidInstruction = formData.instructions.find(instr => !instr.text.trim());
      if (invalidInstruction) {
        newErrors.instructions = 'All instructions must have text';
        isValid = false;
      }
    }

    // Cooking time validation
    if (formData.cookingTime && (!Number(formData.cookingTime) || Number(formData.cookingTime) < 1)) {
      newErrors.cookingTime = 'Cooking time must be a positive number';
      isValid = false;
    }

    // Servings validation
    if (formData.servings && (!Number(formData.servings) || Number(formData.servings) < 1)) {
      newErrors.servings = 'Servings must be a positive number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        thumbnail: formData.imageUrl || ''
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting recipe:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Recipe Title <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter recipe title"
              required
              className={errors.title ? 'border-red-300' : ''}
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter recipe description"
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="cookingTime">Cooking Time (minutes, optional)</Label>
              <Input
                type="number"
                id="cookingTime"
                name="cookingTime"
                min="1"
                value={formData.cookingTime ?? ''}
                onChange={handleChange}
                className={errors.cookingTime ? 'border-red-300' : ''}
              />
              {errors.cookingTime && <p className="mt-1 text-sm text-red-600">{errors.cookingTime}</p>}
            </div>

            <div>
              <Label htmlFor="servings">Servings (optional)</Label>
              <Input
                type="number"
                id="servings"
                name="servings"
                min="1"
                value={formData.servings ?? ''}
                onChange={handleChange}
                className={errors.servings ? 'border-red-300' : ''}
              />
              {errors.servings && <p className="mt-1 text-sm text-red-600">{errors.servings}</p>}
            </div>
          </div>

          {/* Structured Ingredients Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Ingredients <span className="text-red-500">*</span></Label>
              <Button
                type="button"
                variant="outline"
                onClick={addIngredient}
                className="text-blue-500 hover:text-blue-700"
              >
                + Add Ingredient
              </Button>
            </div>
            
            {errors.ingredients && (
              <p className="mt-1 mb-2 text-sm text-red-600">{errors.ingredients}</p>
            )}
            
            <div className="space-y-3">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Input
                    placeholder="Name"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    className="flex-[3]"
                  />
                  <div className="w-28 flex-none">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={ingredient.amount || ''}
                      onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <select
                    value={ingredient.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    className="w-28 flex-none rounded-md border border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                  >
                    {unitOptions.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Notes (optional)"
                    value={ingredient.notes}
                    onChange={(e) => handleIngredientChange(index, 'notes', e.target.value)}
                    className="flex-[2]"
                  />
                  {formData.ingredients.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700 p-2 flex-none w-10"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Structured Instructions Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Instructions <span className="text-red-500">*</span></Label>
              <Button
                type="button"
                variant="outline"
                onClick={addInstruction}
                className="text-blue-500 hover:text-blue-700"
              >
                + Add Step
              </Button>
            </div>
            
            {errors.instructions && (
              <p className="mt-1 mb-2 text-sm text-red-600">{errors.instructions}</p>
            )}
            
            <div className="space-y-3">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-none w-20 pt-2 text-gray-500 text-right">
                    Step {instruction.step}
                  </div>
                  <div className="flex-[4]">
                    <Textarea
                      placeholder="Instruction text"
                      value={instruction.text}
                      onChange={(e) => handleInstructionChange(index, 'text', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Time"
                      value={instruction.time || ''}
                      onChange={(e) => handleInstructionChange(index, 'time', e.target.value)}
                      min="0"
                      className="w-24"
                    />
                    <span className="flex-none text-gray-500 w-12">min</span>
                    {formData.instructions.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeInstruction(index)}
                        className="text-red-500 hover:text-red-700 p-2 flex-none w-10"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
            <Label htmlFor="imageFile">Recipe Image (Optional)</Label>
            <input
              id="imageFile"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              className="block"
              disabled={uploadingImage}
            />
            {uploadingImage && <p className="text-sm text-gray-500">Uploading...</p>}
            {formData.imageUrl && (
              <div className="mt-2">
                <img 
                  src={formData.imageUrl} 
                  alt="Recipe" 
                  className="w-32 h-32 object-cover rounded"
                  onError={(e) => {
                    // If image fails to load, clear it
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    handleRemoveImage();
                  }}
                />
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500">Image preview</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRemoveImage} 
                    className="text-red-500 border-red-300 hover:text-red-700 hover:border-red-500 ml-2"
                  >
                    Remove Image
                  </Button>
                </div>
              </div>
            )}
          </div>

          {!formData.imageUrl && (
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
          )}

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
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Recipe' : 'Save Changes')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

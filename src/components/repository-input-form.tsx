"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Zap } from "lucide-react";
import { useCreateAnalysis } from "@/hooks/use-create-analysis";

const formSchema = z.object({
  url: z
    .string()
    .url("Please enter a valid URL")
    .refine(
      (url) => {
        const githubRegex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/;
        return githubRegex.test(url);
      },
      {
        message:
          "Must be a valid GitHub repository URL (e.g., https://github.com/owner/repo)",
      }
    ),
});

type FormData = z.infer<typeof formSchema>;

interface RepositoryInputFormProps {
  onAnalysisStarted?: (jobId: string) => void;
  initialUrl?: string;
}

export function RepositoryInputForm({
  onAnalysisStarted,
  initialUrl,
}: RepositoryInputFormProps) {
  const { mutate: createAnalysis, isPending } = useCreateAnalysis();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: initialUrl || "",
    },
  });

  // Update form when initialUrl changes (for re-analyze functionality)
  useEffect(() => {
    if (initialUrl) {
      form.reset({ url: initialUrl });
    }
  }, [initialUrl, form]);

  function onSubmit(values: FormData) {
    createAnalysis(values, {
      onSuccess: (data) => {
        if (data.jobId) {
          onAnalysisStarted?.(data.jobId);
          form.reset();
        }
      },
    });
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Enter Repository URL</CardTitle>
        <CardDescription>
          Paste any GitHub repository URL to generate comprehensive
          documentation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Repository URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://github.com/owner/repository"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
              size="lg">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing & Generating Wiki...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Wiki Documentation
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3">Example Repositories:</h4>
          <div className="flex flex-wrap gap-2">
            {[
              "https://github.com/Textualize/rich-cli",
              "https://github.com/browser-use/browser-use",
              "https://github.com/tastejs/todomvc",
            ].map((url) => (
              <Button
                key={url}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => form.setValue("url", url)}
                disabled={isPending}>
                {url.split("/").slice(-2).join("/")}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

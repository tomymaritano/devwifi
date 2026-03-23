<script lang="ts">
  import * as Card from '$lib/components/ui/card/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
</script>

<main class="p-8">
  <h1 class="text-3xl font-bold text-blue-500 mb-6">devwifi</h1>

  <Card.Root class="max-w-sm">
    <Card.Header>
      <Card.Title>System Status</Card.Title>
      <Card.Description>shadcn-svelte is working</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex gap-2">
        <Badge variant="secondary">online</Badge>
        <Badge variant="outline">2.4 GHz</Badge>
      </div>
    </Card.Content>
    <Card.Footer>
      <Button variant="outline" size="sm">View Details</Button>
    </Card.Footer>
  </Card.Root>
</main>

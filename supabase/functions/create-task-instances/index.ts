import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Task {
  id: string
  family_id: string
  title: string
  value_cents: number
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly'
  active: boolean
}

interface Daughter {
  id: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active recurring tasks
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('active', true)
      .neq('recurrence', 'none')

    if (tasksError) {
      throw tasksError
    }

    // Get all daughters
    const { data: daughters, error: daughtersError } = await supabaseClient
      .from('daughters')
      .select('id')

    if (daughtersError) {
      throw daughtersError
    }

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let createdInstances = 0

    for (const task of tasks as Task[]) {
      for (const daughter of daughters as Daughter[]) {
        let dueDate: Date | null = null

        // Calculate due date based on recurrence
        switch (task.recurrence) {
          case 'daily':
            dueDate = tomorrow
            break
          case 'weekly':
            dueDate = new Date(tomorrow)
            dueDate.setDate(tomorrow.getDate() + 7)
            break
          case 'monthly':
            dueDate = new Date(tomorrow)
            dueDate.setMonth(tomorrow.getMonth() + 1)
            break
        }

        if (!dueDate) continue

        // Check if instance already exists for this date
        const { data: existingInstance } = await supabaseClient
          .from('task_instances')
          .select('id')
          .eq('task_id', task.id)
          .eq('daughter_id', daughter.id)
          .eq('due_date', dueDate.toISOString().split('T')[0])
          .single()

        if (!existingInstance) {
          // Create new task instance
          const { error: instanceError } = await supabaseClient
            .from('task_instances')
            .insert({
              task_id: task.id,
              daughter_id: daughter.id,
              due_date: dueDate.toISOString().split('T')[0],
              status: 'pending'
            })

          if (!instanceError) {
            createdInstances++
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Created ${createdInstances} task instances`,
        created: createdInstances 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )

  } catch (error) {
    console.error('Error creating task instances:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  }
})
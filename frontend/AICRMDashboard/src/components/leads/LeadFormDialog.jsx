import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dialog, Button, Field, Input, Select, Textarea } from "../ui";
import { leadsApi } from "../../lib/services";
import { LEAD_STAGES, LEAD_PRIORITIES, LEAD_SOURCES } from "../../lib/constants";

/**
 * Create / edit a lead. When `lead` is provided we're editing; otherwise
 * creating. Calls `onSaved(lead)` so the parent can refresh its list.
 */
export function LeadFormDialog({ open, onClose, lead, onSaved }) {
  const editing = Boolean(lead?._id);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Reset the form whenever the target lead changes / dialog opens.
  useEffect(() => {
    if (!open) return;
    reset({
      name: lead?.name || "",
      email: lead?.email || "",
      phone: lead?.phone || "",
      company: lead?.company || "",
      status: lead?.status || "New",
      priority: lead?.priority || "Medium",
      source: lead?.source || "Website",
      value: lead?.value || 0,
      notes: lead?.notes || "",
    });
  }, [open, lead, reset]);

  const onSubmit = async (form) => {
    const payload = { ...form, value: Number(form.value) || 0 };
    try {
      const res = editing
        ? await leadsApi.update(lead._id, payload)
        : await leadsApi.create(payload);
      toast.success(editing ? "Lead updated" : "Lead created");
      onSaved?.(res.lead);
      onClose();
    } catch (err) {
      toast.error(err.message || "Could not save lead");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit lead" : "New lead"}
      description={editing ? "Update this lead's details." : "Add a lead to your pipeline."}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" error={errors.name?.message} className="col-span-2">
            <Input
              placeholder="Contact name"
              {...register("name", { required: "Name is required" })}
            />
          </Field>
          <Field label="Company">
            <Input placeholder="Company" {...register("company")} />
          </Field>
          <Field label="Email">
            <Input type="email" placeholder="email@company.com" {...register("email")} />
          </Field>
          <Field label="Phone">
            <Input placeholder="+1 555 0100" {...register("phone")} />
          </Field>
          <Field label="Deal value (USD)">
            <Input type="number" min="0" placeholder="0" {...register("value")} />
          </Field>
          <Field label="Stage">
            <Select {...register("status")}>
              {LEAD_STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select {...register("priority")}>
              {LEAD_PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Source" className="col-span-2">
            <Select {...register("source")}>
              {LEAD_SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notes" className="col-span-2">
            <Textarea placeholder="Context, next steps…" {...register("notes")} />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {editing ? "Save changes" : "Create lead"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

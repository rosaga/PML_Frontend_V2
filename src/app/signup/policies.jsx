"use client";

import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowRight,
  Check,
  ExternalLink,
  X,
} from "lucide-react";

import { POLICIES } from "@/lib/policies";

export { POLICIES };

export default function PolicyReview({ acknowledged, onAcknowledge }) {
  const [activePolicy, setActivePolicy] = useState(null);
  const fullScreen = useMediaQuery("(max-width: 640px)");
  const completed = POLICIES.filter((policy) => acknowledged[policy.id]).length;
  const nextPolicy = POLICIES.find(
    (policy) => policy.id !== activePolicy?.id && !acknowledged[policy.id]
  );

  return (
    <>
      <div className="signup-review-progress" aria-live="polite">
        <span>{completed === POLICIES.length ? "You’re all set" : "Read at your own pace"}</span>
        <span className={completed === POLICIES.length ? "is-complete" : ""}>
          {completed} of {POLICIES.length} acknowledged
        </span>
      </div>
      <div className="signup-policy-list">
        {POLICIES.map((policy) => {
          const Icon = policy.icon;
          return (
            <div
              key={policy.id}
              className={`signup-policy-card${acknowledged[policy.id] ? " is-acknowledged" : ""}`}
            >
              <span className="signup-policy-icon"><Icon size={22} strokeWidth={1.6} /></span>
              <div className="signup-policy-copy">
                <span className="signup-policy-title">{policy.title}</span>
                <span className="signup-policy-description">{policy.description}</span>
                <button
                  type="button"
                  className="signup-policy-action"
                  onClick={() => setActivePolicy(policy)}
                  aria-label={`Read ${policy.title}`}
                  aria-haspopup="dialog"
                >
                  {acknowledged[policy.id] ? <><Check size={15} /> Acknowledged · Read again</> : <>Read document <ArrowRight size={15} /></>}
                </button>
                <label className="signup-consent signup-card-consent">
                  <input
                    type="checkbox"
                    checked={!!acknowledged[policy.id]}
                    onChange={(event) => onAcknowledge(policy.id, event.target.checked)}
                  />
                  <span>{policy.acknowledgement}</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!activePolicy}
        onClose={() => setActivePolicy(null)}
        fullScreen={fullScreen}
        maxWidth="md"
        fullWidth
        aria-labelledby="signup-document-title"
        PaperProps={{ className: "signup-reader" }}
      >
        {activePolicy && (
          <>
            <DialogTitle id="signup-reader-header" component="div" className="signup-reader-heading">
              <div>
                <h2 id="signup-document-title">{activePolicy.title}</h2>
                <a href={activePolicy.href} target="_blank" rel="noopener noreferrer">
                  Open in a new tab <ExternalLink size={14} />
                </a>
              </div>
              <IconButton aria-label="Close document" onClick={() => setActivePolicy(null)}>
                <X size={21} />
              </IconButton>
            </DialogTitle>
            <DialogContent className="signup-reader-content">
              <iframe
                key={activePolicy.id}
                src={activePolicy.href}
                title={activePolicy.title}
                className="signup-document"
              />
            </DialogContent>
            <DialogActions className="signup-reader-actions">
              <label className="signup-consent">
                <input
                  type="checkbox"
                  checked={!!acknowledged[activePolicy.id]}
                  onChange={(event) => onAcknowledge(activePolicy.id, event.target.checked)}
                />
                <span>{activePolicy.acknowledgement}</span>
              </label>
              <button
                type="button"
                className="signup-submit"
                onClick={() => {
                  if (acknowledged[activePolicy.id] && nextPolicy) {
                    setActivePolicy(nextPolicy);
                  } else {
                    setActivePolicy(null);
                  }
                }}
              >
                {acknowledged[activePolicy.id] && nextPolicy ? <>Next document <ArrowRight size={17} /></> : "Done"}
              </button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}

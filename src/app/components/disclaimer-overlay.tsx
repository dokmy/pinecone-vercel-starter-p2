"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DashboardOverlay = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const hasSeenOverlay = sessionStorage.getItem("hasSeenOverlay");
    if (!hasSeenOverlay) {
      setShowOverlay(true);
      sessionStorage.setItem("hasSeenOverlay", "true");
    }
  }, []);

  const handleCloseOverlay = () => {
    setShowOverlay(false);
  };

  return (
    <div>
      {showOverlay && (
        <Dialog open={showOverlay} onOpenChange={setShowOverlay}>
          <DialogContent className="sm:max-w-2/3 h-30 ">
            <DialogHeader>
              <DialogTitle>Disclaimer</DialogTitle>
              <DialogDescription>
                <div className="p-6 rounded-lg">
                  <p className="text-base mb-4">
                    The results generated by{" "}
                    <strong className="font-bold">FastLegal</strong> are
                    intended to assist legal professionals in their research
                    efforts by identifying potentially relevant past judgments
                    and case law. However, the software&apos;s output should{" "}
                    <strong className="font-bold">not</strong> be considered a
                    substitute for professional legal analysis, advice, or
                    services.
                  </p>
                  <p className="text-base text-red-600 italic mt-6">
                    <strong className="font-bold">
                      FastLegal is provided &quot;as is&quot; without warranty
                      of any kind, either expressed or implied, including, but
                      not limited to, the implied warranties of merchantability,
                      fitness for a particular purpose, or non-infringement.
                    </strong>
                  </p>
                  <p className="text-base mt-4">
                    By using FastLegal, you acknowledge and agree to these terms
                    and conditions. If you do not agree, please refrain from
                    using this software.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button onClick={handleCloseOverlay}>Accept and Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DashboardOverlay;

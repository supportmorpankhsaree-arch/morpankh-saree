import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

interface MandatoryNoticeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const MandatoryNoticeModal = ({ open, onOpenChange, onConfirm }: MandatoryNoticeModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(95%,560px)] max-w-[560px] rounded-[16px] bg-white p-6 sm:p-8 shadow-xl">
        <div className="relative">
          <DialogClose className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-[22px] sm:text-[24px]" style={{ color: '#E53935' }}>
              ⚠️ IMPORTANT NOTICE
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <div className="bg-[#F8F8F8] border border-[#EAEAEA] rounded-[12px] p-[18px] text-sm text-foreground">
              <ul className="list-disc pl-5 space-y-3">
                <li>Parcel opening video is required for returns.</li>
                <li>Please enter the <strong>correct address</strong> and <strong>WhatsApp number</strong>. <strong>₹90 extra</strong> will be charged if the parcel is returned due to wrong details.</li>
                <li>Check the <strong>Size &amp; Colour</strong> before ordering.</li>
                <li>Please read the <strong>Return &amp; Exchange Policy</strong> before placing your order.</li>
              </ul>
            </div>

            <hr className="my-4 border-t border-gray-200" />

            <div>
              <h3 className="text-center font-bold text-[22px] sm:text-[24px]" style={{ color: '#E53935' }}>
                ⚠️ महत्त्वाची सूचना
              </h3>

              <div className="mt-4 bg-[#F8F8F8] border border-[#EAEAEA] rounded-[12px] p-[18px] text-sm" lang="mr">
                <ul className="list-disc pl-5 space-y-3">
                  <li>रिटर्नसाठी पार्सल उघडतानाचा व्हिडिओ आवश्यक आहे.</li>
                  <li>कृपया योग्य पत्ता व <strong>WhatsApp</strong> नंबर भरा. चुकीच्या माहितीमुळे पार्सल परत आल्यास <strong>₹90 अतिरिक्त शुल्क</strong> आकारले जाईल.</li>
                  <li>ऑर्डर करण्यापूर्वी <strong>Colour</strong> तपासा.</li>
                  <li>ऑर्डर देण्यापूर्वी <strong>Return &amp; Exchange Policy</strong> वाचा.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-[52px] rounded-[10px] border-gray-300 text-gray-700 hover:text-black hover:bg-gray-100 font-bold tracking-wide"
              onClick={() => onOpenChange(false)}
            >
              SKIP
            </Button>
            <Button
              className="flex-1 h-[52px] rounded-[10px] bg-primary text-white font-bold hover:brightness-95 tracking-wide"
              onClick={handleConfirm}
            >
              CONFIRM &amp; PROCEED
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MandatoryNoticeModal;

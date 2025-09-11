using FluentValidation;
using Application.Features.Matches.Commands.CreateMatch;

namespace Application.Validators;

public class CreateMatchCommandValidator : AbstractValidator<CreateMatchCommand>
{
    public CreateMatchCommandValidator()
    {
        RuleFor(x => x.Player1Id)
            .NotEmpty().WithMessage("Oyuncu 1 ID boş olamaz");

        RuleFor(x => x.Player2Id)
            .NotEmpty().WithMessage("Oyuncu 2 ID boş olamaz");

        RuleFor(x => x.Player1Score)
            .InclusiveBetween(0, 7).WithMessage("Skor 0-7 arasında olmalıdır");

        RuleFor(x => x.Player2Score)
            .InclusiveBetween(0, 7).WithMessage("Skor 0-7 arasında olmalıdır");
    }
}
